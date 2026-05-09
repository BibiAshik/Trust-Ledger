package com.trustledger.controller;

import com.trustledger.entity.Loan;
import com.trustledger.entity.LoanNote;
import com.trustledger.entity.LoanStatus;
import com.trustledger.service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

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
}
