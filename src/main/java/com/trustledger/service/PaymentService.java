package com.trustledger.service;

import com.trustledger.entity.Loan;
import com.trustledger.entity.LoanStatus;
import com.trustledger.entity.Payment;
import com.trustledger.entity.PaymentType;
import com.trustledger.repository.LoanRepository;
import com.trustledger.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LoanRepository loanRepository;

    public List<Payment> getPaymentsForLoan(Long loanId) {
        return paymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId);
    }

    @Transactional
    public Payment makePayment(Long loanId, Double amount, PaymentType type) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        if (type == null) {
            throw new IllegalArgumentException("Payment type is required");
        }

        Optional<Loan> loanOpt = loanRepository.findById(loanId);
        if (loanOpt.isEmpty()) {
            throw new RuntimeException("Loan not found");
        }

        Loan loan = loanOpt.get();
        
        if (type == PaymentType.INTEREST) {
            double currentPending = loan.getTotalPendingInterest() != null ? loan.getTotalPendingInterest() : 0.0;
            double remaining = currentPending - amount;
            if(remaining < 0) remaining = 0.0;
            loan.setTotalPendingInterest(remaining);
        } else if (type == PaymentType.PRINCIPAL) {
            double currentPrincipal = loan.getRemainingPrincipal() != null ? loan.getRemainingPrincipal() : 0.0;
            double remaining = currentPrincipal - amount;
            if(remaining < 0) remaining = 0.0;
            loan.setRemainingPrincipal(remaining);
        } else if (type == PaymentType.FULL_CLOSURE) {
            loan.setRemainingPrincipal(0.0);
            loan.setTotalPendingInterest(0.0);
            loan.setStatus(LoanStatus.CLOSED);
        }

        double remainingPrincipal = loan.getRemainingPrincipal() != null ? loan.getRemainingPrincipal() : 0.0;
        double pendingInterest = loan.getTotalPendingInterest() != null ? loan.getTotalPendingInterest() : 0.0;
        if (remainingPrincipal <= 0 && pendingInterest <= 0) {
            loan.setStatus(LoanStatus.CLOSED);
        }

        loanRepository.save(loan);

        Payment payment = new Payment();
        payment.setLoan(loan);
        payment.setAmount(amount);
        payment.setType(type);
        return paymentRepository.save(payment);
    }
}
