package com.trustledger.controller;

import com.trustledger.entity.Customer;
import com.trustledger.entity.Loan;
import com.trustledger.entity.LoanNote;
import com.trustledger.entity.LoanStatus;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping
    public List<Loan> getAllLoans() {
        loanService.checkOverdueAndAuctionStatus();
        return loanService.getAllLoans();
    }
    
    @GetMapping("/status/{status}")
    public List<Loan> getLoansByStatus(@PathVariable LoanStatus status) {
        loanService.checkOverdueAndAuctionStatus();
        return loanService.getLoansByStatus(status);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Loan> getLoanById(@PathVariable Long id) {
        Optional<Loan> loan = loanService.getLoanById(id);
        return loan.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public List<Loan> getLoansByCustomer(@PathVariable Long customerId) {
        return loanService.getLoansByCustomerId(customerId);
    }

    @PostMapping
    public ResponseEntity<?> createLoan(@RequestBody Loan loan) {
        try {
            return ResponseEntity.ok(loanService.createLoan(loan));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create loan with multipart form data (supports file uploads for gold photos and documents).
     */
    @PostMapping("/create")
    public ResponseEntity<?> createLoanWithFiles(
            @RequestParam("customerId") Long customerId,
            @RequestParam("itemType") String itemType,
            @RequestParam(value = "numberOfItems", required = false) Integer numberOfItems,
            @RequestParam(value = "grossWeight", required = false) Double grossWeight,
            @RequestParam(value = "weight", required = false) Double weight,
            @RequestParam(value = "purity", required = false) String purity,
            @RequestParam(value = "estimatedValue", required = false) Double estimatedValue,
            @RequestParam("loanAmount") Double loanAmount,
            @RequestParam("interestPercentage") Double interestPercentage,
            @RequestParam(value = "loanDate", required = false) String loanDateStr,
            @RequestParam(value = "loanPeriod", required = false) String loanPeriod,
            @RequestParam(value = "dueDate", required = false) String dueDateStr,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "goldPhotos", required = false) MultipartFile[] goldPhotos,
            @RequestParam(value = "documents", required = false) MultipartFile[] documents
    ) {
        try {
            // Validate customer
            Optional<Customer> customerOpt = customerRepository.findById(customerId);
            if (customerOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Customer not found"));
            }

            Loan loan = new Loan();
            loan.setCustomer(customerOpt.get());
            loan.setItemType(itemType);
            loan.setNumberOfItems(numberOfItems);
            loan.setGrossWeight(grossWeight);
            loan.setWeight(weight != null ? weight : grossWeight); // Use weight or fallback to grossWeight
            loan.setPurity(purity);
            loan.setEstimatedValue(estimatedValue);
            loan.setLoanAmount(loanAmount);
            loan.setInterestPercentage(interestPercentage);
            loan.setLoanPeriod(loanPeriod);
            loan.setRemarks(remarks);

            // Parse loan date
            if (loanDateStr != null && !loanDateStr.isEmpty()) {
                loan.setLoanDate(LocalDate.parse(loanDateStr));
            } else {
                loan.setLoanDate(LocalDate.now());
            }

            // Parse due date
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                loan.setDueDate(LocalDate.parse(dueDateStr));
            }

            // Handle gold photo uploads
            if (goldPhotos != null && goldPhotos.length > 0) {
                List<String> photoUrls = saveFiles(goldPhotos, "uploads/gold-photos/");
                loan.setGoldPhotoUrls(String.join(",", photoUrls));
            }

            // Handle document uploads
            if (documents != null && documents.length > 0) {
                List<String> docUrls = saveFiles(documents, "uploads/loan-documents/");
                loan.setDocumentUrls(String.join(",", docUrls));
            }

            Loan savedLoan = loanService.createLoan(loan);
            return ResponseEntity.ok(savedLoan);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "File upload failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<Loan> renewLoan(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String reason = payload.get("reason");
        LocalDate newDueDate = LocalDate.parse(payload.get("newDueDate"));
        Loan renewed = loanService.renewLoan(id, reason, newDueDate);
        if (renewed != null) return ResponseEntity.ok(renewed);
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<LoanNote> addNote(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String noteText = payload.get("noteText");
        LoanNote note = loanService.addNoteToLoan(id, noteText);
        if (note != null) return ResponseEntity.ok(note);
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/notes")
    public List<LoanNote> getNotes(@PathVariable Long id) {
        return loanService.getLoanNotes(id);
    }

    /**
     * Save uploaded files to disk and return their public URLs.
     */
    private List<String> saveFiles(MultipartFile[] files, String uploadDir) throws IOException {
        List<String> urls = new ArrayList<>();
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            int extIndex = originalFileName.lastIndexOf(".");
            if (extIndex > 0) {
                fileExtension = originalFileName.substring(extIndex);
            }

            String newFileName = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            urls.add("/" + uploadDir + newFileName);
        }
        return urls;
    }
}
