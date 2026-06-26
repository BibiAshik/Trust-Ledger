package com.trustledger.dto;

import java.time.LocalDateTime;

public record CustomerDto(
        Long id,
        String name,
        String phoneNumber,
        String dateOfBirth,
        String gender,
        String maritalStatus,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String pinCode,
        String occupation,
        String monthlyIncome,
        String identityProofType,
        String identityProofNumber,
        String remarks,
        String photoUrl,
        String email,
        String tempPassword,
        boolean firstLogin,
        LocalDateTime createdAt
) {
}
