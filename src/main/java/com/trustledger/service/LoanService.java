package com.trustledger.service;

import com.trustledger.entity.*;
import com.trustledger.repository.LoanNoteRepository;
import com.trustledger.repository.LoanRepository;
import com.trustledger.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LoanNoteRepository loanNoteRepository;

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public Optional<Loan> getLoanById(Long id) {
        return loanRepository.findById(id);
    }

    public List<Loan> getLoansByCustomerId(Long customerId) {
        return loanRepository.findByCustomerId(customerId);
    }

    public List<Loan> getLoansByStatus(LoanStatus status) {
        return loanRepository.findByStatus(status);
    }

    public Loan createLoan(Loan loan) {
        if (loan.getLoanAmount() == null || loan.getLoanAmount() <= 0) {
            throw new IllegalArgumentException("Loan amount must be greater than zero");
        }
        if (loan.getInterestPercentage() == null || loan.getInterestPercentage() < 0) {
            throw new IllegalArgumentException("Interest percentage must not be negative");
        }
        if (loan.getLoanDate() == null) {
            loan.setLoanDate(LocalDate.now());
        }

        loan.setRemainingPrincipal(loan.getLoanAmount());
        loan.setTotalPendingInterest(0.0);
        loan.setStatus(LoanStatus.ACTIVE);
        return loanRepository.save(loan);
    }

    @Transactional
    public void calculateMonthlyInterest() {
        List<Loan> activeLoans = loanRepository.findByStatus(LoanStatus.ACTIVE);
        for (Loan loan : activeLoans) {
            double principal = loan.getRemainingPrincipal() != null ? loan.getRemainingPrincipal() : 0.0;
            double interestRate = loan.getInterestPercentage() != null ? loan.getInterestPercentage() : 0.0;
            double pendingInterest = loan.getTotalPendingInterest() != null ? loan.getTotalPendingInterest() : 0.0;
            double monthlyInterest = (principal * interestRate) / 100.0;
            loan.setTotalPendingInterest(pendingInterest + monthlyInterest);
            loanRepository.save(loan);
        }
    }

    public void checkOverdueAndAuctionStatus() {
        List<Loan> activeLoans = loanRepository.findByStatus(LoanStatus.ACTIVE);
        List<Loan> overdueLoans = loanRepository.findByStatus(LoanStatus.OVERDUE);

        LocalDate today = LocalDate.now();

        // Check Active -> Overdue
        for (Loan loan : activeLoans) {
            if (loan.getDueDate() != null && loan.getDueDate().isBefore(today)) {
                loan.setStatus(LoanStatus.OVERDUE);
                loanRepository.save(loan);
            }
        }

        // Check Overdue -> Auction Eligible
        for (Loan loan : overdueLoans) {
            if (loan.getDueDate() != null && loan.getDueDate().plusMonths(3).isBefore(today)) {
                loan.setStatus(LoanStatus.AUCTION_ELIGIBLE);
                loanRepository.save(loan);
            }
        }
    }

    public Loan renewLoan(Long id, String reason, LocalDate newDueDate) {
        Optional<Loan> loanOpt = loanRepository.findById(id);
        if (loanOpt.isPresent()) {
            Loan loan = loanOpt.get();
            loan.setDueDate(newDueDate);
            loan.setRenewedDate(LocalDate.now());
            int renewalCount = loan.getRenewalCount() != null ? loan.getRenewalCount() : 0;
            loan.setRenewalCount(renewalCount + 1);
            if (loan.getStatus() == LoanStatus.OVERDUE || loan.getStatus() == LoanStatus.AUCTION_ELIGIBLE) {
                loan.setStatus(LoanStatus.ACTIVE);
            }
            loanRepository.save(loan);

            addNoteToLoan(id, "Loan Extended: " + reason);
            return loan;
        }
        return null;
    }

    public LoanNote addNoteToLoan(Long loanId, String noteText) {
        Optional<Loan> loanOpt = loanRepository.findById(loanId);
        if (loanOpt.isPresent()) {
            LoanNote note = new LoanNote();
            note.setLoan(loanOpt.get());
            note.setNoteText(noteText);
            return loanNoteRepository.save(note);
        }
        return null;
    }

    public List<LoanNote> getLoanNotes(Long loanId) {
        return loanNoteRepository.findByLoanIdOrderByCreatedAtDesc(loanId);
    }
}
