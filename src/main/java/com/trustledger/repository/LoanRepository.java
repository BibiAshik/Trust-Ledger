package com.trustledger.repository;

import com.trustledger.entity.Loan;
import com.trustledger.entity.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByCustomerId(Long customerId);
    List<Loan> findByStatus(LoanStatus status);
    long countByStatus(LoanStatus status);
}
