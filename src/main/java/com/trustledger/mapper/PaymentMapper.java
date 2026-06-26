package com.trustledger.mapper;

import com.trustledger.dto.PaymentDto;
import com.trustledger.entity.Loan;
import com.trustledger.entity.Payment;

public final class PaymentMapper {

    private PaymentMapper() {
    }

    public static PaymentDto toDto(Payment payment) {
        if (payment == null) {
            return null;
        }

        Loan loan = payment.getLoan();
        Long loanId = loan != null ? loan.getId() : null;

        return new PaymentDto(
                payment.getId(),
                loanId,
                LoanMapper.toDto(loan),
                payment.getType(),
                payment.getAmount(),
                payment.getPaymentMode(),
                payment.getRazorpayOrderId(),
                payment.getRazorpayPaymentId(),
                payment.getRazorpaySignature(),
                payment.getStatus(),
                payment.getPaymentDate()
        );
    }
}
