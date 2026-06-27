package com.trustledger.controller;

import com.trustledger.entity.Customer;
import com.trustledger.entity.Loan;
import com.trustledger.entity.Payment;
import com.trustledger.service.CustomerPortalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer-portal")
public class CustomerPortalController {

    @Autowired
    private CustomerPortalService customerPortalService;

    // ============================
    // EASY: GET Profile
    // ============================
    @GetMapping("/profile")
    public ResponseEntity<Customer> getMyProfile() {
        Customer customer = customerPortalService.getMyProfile();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(customer);
    }

    // ============================
    // MODERATE: GET Loans & Payments
    // ============================
    @GetMapping("/loans")
    public ResponseEntity<List<Loan>> getMyLoans() {
        List<Loan> loans = customerPortalService.getMyLoans();
        if (loans == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/loans/{id}")
    public ResponseEntity<Loan> getMyLoanDetails(@PathVariable Long id) {
        Loan loan = customerPortalService.getMyLoanDetails(id);
        if (loan == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(loan);
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getMyPayments() {
        List<Payment> payments = customerPortalService.getMyPayments();
        if (payments == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/loans/{id}/payments")
    public ResponseEntity<List<Payment>> getMyLoanPayments(@PathVariable Long id) {
        List<Payment> payments = customerPortalService.getMyLoanPayments(id);
        if (payments == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(payments);
    }

    // ============================
    // TOUGH: Change Password
    // ============================
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password cannot be empty");
        }
        boolean success = customerPortalService.changePassword(newPassword);
        if (!success) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok().build();
    }
}
