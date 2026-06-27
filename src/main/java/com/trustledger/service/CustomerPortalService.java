package com.trustledger.service;

import com.trustledger.entity.Customer;
import com.trustledger.entity.Loan;
import com.trustledger.entity.Payment;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.repository.LoanRepository;
import com.trustledger.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerPortalService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CustomerService customerService;

    // ============================
    // EASY: Get Profile
    // ============================
    public Customer getMyProfile() {
        return getAuthenticatedCustomer();
    }

    // ============================
    // MODERATE: Get Loans & Payments
    // ============================
    public List<Loan> getMyLoans() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return null;
        return loanRepository.findByCustomerId(customer.getId());
    }

    public Loan getMyLoanDetails(Long id) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return null;
        Optional<Loan> loan = loanRepository.findById(id);
        if (loan.isPresent() && loan.get().getCustomer().getId().equals(customer.getId())) {
            return loan.get();
        }
        return null;
    }

    public List<Payment> getMyPayments() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return null;
        return paymentRepository.findByLoanCustomerIdOrderByPaymentDateDesc(customer.getId());
    }

    public List<Payment> getMyLoanPayments(Long id) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return null;

        Optional<Loan> loan = loanRepository.findById(id);
        if (loan.isEmpty() || !loan.get().getCustomer().getId().equals(customer.getId())) {
            return null; // Signals not found or unauthorized
        }

        return paymentRepository.findByLoanIdOrderByPaymentDateDesc(id);
    }

    // ============================
    // TOUGH: Change Password
    // ============================
    public boolean changePassword(String newPassword) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return false;
        
        customerService.changePassword(customer.getId(), newPassword);
        return true;
    }

    // ============================
    // TOUGH: Helper
    // ============================
    private Customer getAuthenticatedCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String principal = auth.getName();
            return customerRepository.findByPhoneNumberOrEmail(principal, principal).orElse(null);
        }
        return null;
    }
}
