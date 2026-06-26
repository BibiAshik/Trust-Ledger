package com.trustledger.dto;

import com.trustledger.entity.LoanStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LoanDto(
        Long id,
        Long customerId,
        CustomerDto customer,
        String itemType,
        Integer numberOfItems,
        Double weight,
        Double grossWeight,
        String purity,
        Double estimatedValue,
        Double loanAmount,
        Double remainingPrincipal,
        Double interestPercentage,
        Double totalPendingInterest,
        LocalDate loanDate,
        LocalDate dueDate,
        LocalDate renewedDate,
        String loanPeriod,
        Integer renewalCount,
        LoanStatus status,
        String remarks,
        String goldPhotoUrls,
        String documentUrls,
        LocalDate lastInterestCalculatedDate,
        LocalDateTime createdAt
) {
}
