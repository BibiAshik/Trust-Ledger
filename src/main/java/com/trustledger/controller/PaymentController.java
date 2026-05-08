package com.trustledger.controller;

import com.trustledger.entity.Payment;
import com.trustledger.entity.PaymentType;
import com.trustledger.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/loan/{loanId}")
    public List<Payment> getPaymentsByLoan(@PathVariable Long loanId) {
        return paymentService.getPaymentsForLoan(loanId);
    }

    @PostMapping("/loan/{loanId}")
    public ResponseEntity<?> makePayment(@PathVariable Long loanId, @RequestBody Map<String, String> payload) {
        try {
            Double amount = Double.parseDouble(payload.get("amount"));
            PaymentType type = PaymentType.valueOf(payload.get("type"));
            Payment payment = paymentService.makePayment(loanId, amount, type);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
