package com.trustledger.dto;

import com.trustledger.entity.PaymentMode;
import com.trustledger.entity.PaymentType;

import java.time.LocalDateTime;

public record PaymentDto(
        Long id,
        Long loanId,
        LoanDto loan,
        PaymentType type,
        Double amount,
        PaymentMode paymentMode,
        String razorpayOrderId,
        String razorpayPaymentId,
        String razorpaySignature,
        String status,
        LocalDateTime paymentDate
) {
}
