package com.trustledger.dto;

import java.time.LocalDateTime;

public record LoanNoteDto(
        Long id,
        Long loanId,
        String noteText,
        LocalDateTime createdAt
) {
}
