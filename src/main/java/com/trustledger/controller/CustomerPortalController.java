package com.trustledger.controller;

import com.trustledger.entity.Customer;
import com.trustledger.entity.Loan;
import com.trustledger.entity.Payment;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.repository.LoanRepository;
import com.trustledger.repository.PaymentRepository;
import com.trustledger.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/customer-portal")
public class CustomerPortalController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CustomerService customerService;

    @GetMapping("/loans")
    public ResponseEntity<List<Loan>> getMyLoans() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(loanRepository.findByCustomerId(customer.getId()));
    }

    @GetMapping("/loans/{id}")
    public ResponseEntity<Loan> getMyLoanDetails(@PathVariable Long id) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<Loan> loan = loanRepository.findById(id);
        if (loan.isPresent() && loan.get().getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.ok(loan.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getMyPayments() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(paymentRepository.findByLoanCustomerIdOrderByPaymentDateDesc(customer.getId()));
    }

    @GetMapping("/loans/{id}/payments")
    public ResponseEntity<List<Payment>> getMyLoanPayments(@PathVariable Long id) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<Loan> loan = loanRepository.findById(id);
        if (loan.isEmpty() || !loan.get().getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(paymentRepository.findByLoanIdOrderByPaymentDateDesc(id));
    }

    @GetMapping("/profile")
    public ResponseEntity<Customer> getMyProfile() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(customer);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password cannot be empty");
        }
        customerService.changePassword(customer.getId(), newPassword);
        return ResponseEntity.ok().build();
    }

    private Customer getAuthenticatedCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String principal = auth.getName();
            // JWT stores phone number as the subject for customers
            return customerRepository.findByPhoneNumberOrEmail(principal, principal).orElse(null);
        }
        return null;
    }
}
