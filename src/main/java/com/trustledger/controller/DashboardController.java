package com.trustledger.controller;

import com.trustledger.entity.LoanStatus;
import com.trustledger.entity.PaymentType;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.repository.LoanRepository;
import com.trustledger.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCustomers", customerRepository.count());
        summary.put("activeLoans", loanRepository.countByStatus(LoanStatus.ACTIVE));
        summary.put("closedLoans", loanRepository.countByStatus(LoanStatus.CLOSED));
        summary.put("overdueLoans", loanRepository.countByStatus(LoanStatus.OVERDUE));
        summary.put("auctionEligibleLoans", loanRepository.countByStatus(LoanStatus.AUCTION_ELIGIBLE));
        
        Double totalInterest = paymentRepository.findByType(PaymentType.INTEREST)
                .stream()
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
                .sum();
        summary.put("totalInterestCollected", totalInterest);
        
        return summary;
    }
}
