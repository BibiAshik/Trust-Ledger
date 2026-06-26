package com.trustledger.repository;

import com.trustledger.entity.Payment;
import com.trustledger.entity.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByLoanIdOrderByPaymentDateDesc(Long loanId);
    List<Payment> findByLoanCustomerIdOrderByPaymentDateDesc(Long customerId);
    List<Payment> findByType(PaymentType type);
}
