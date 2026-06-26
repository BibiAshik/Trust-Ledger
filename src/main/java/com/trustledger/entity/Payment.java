package com.trustledger.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Loan loan;

    @Enumerated(EnumType.STRING)
    private PaymentType type; // INTEREST, PRINCIPAL, FULL_CLOSURE

    private Double amount;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode = PaymentMode.CASH;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    
    private String status = "SUCCESS"; // SUCCESS, PENDING, FAILED

    @Column(nullable = false, updatable = false)
    private LocalDateTime paymentDate = LocalDateTime.now();
}
