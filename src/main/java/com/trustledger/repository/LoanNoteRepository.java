package com.trustledger.repository;

import com.trustledger.entity.LoanNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanNoteRepository extends JpaRepository<LoanNote, Long> {
    List<LoanNote> findByLoanIdOrderByCreatedAtDesc(Long loanId);
}
