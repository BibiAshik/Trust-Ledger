package com.trustledger.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "loans")
@Data
@NoArgsConstructor
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Customer customer;

    private String itemType; // chain, ring, bracelet, coins
    private Integer numberOfItems; // Number of gold items
    private Double weight; // in grams (gross weight)
    private Double grossWeight; // Gross weight in grams
    private String purity; // e.g., 22K, 24K
    private Double estimatedValue;

    private Double loanAmount;
    private Double remainingPrincipal;
    private Double interestPercentage; // Monthly interest percentage
    private Double totalPendingInterest;

    private LocalDate loanDate;
    private LocalDate dueDate;
    private LocalDate renewedDate;
    private String loanPeriod; // e.g., "3 months", "6 months", "12 months"

    private Integer renewalCount = 0;

    @Enumerated(EnumType.STRING)
    private LoanStatus status; // ACTIVE, OVERDUE, CLOSED, AUCTION_ELIGIBLE

    @Column(columnDefinition = "TEXT")
    private String remarks; // Item description / remarks

    @Column(columnDefinition = "TEXT")
    private String goldPhotoUrls; // Comma-separated photo URLs

    @Column(columnDefinition = "TEXT")
    private String documentUrls; // Comma-separated document URLs

    private LocalDate lastInterestCalculatedDate; // Tracks when interest was last accrued

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
