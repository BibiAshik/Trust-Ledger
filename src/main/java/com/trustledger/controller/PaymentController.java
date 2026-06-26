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

    @org.springframework.beans.factory.annotation.Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

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

    @PostMapping("/create-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody Map<String, String> payload) {
        try {
            Long loanId = Long.parseLong(payload.get("loanId"));
            Double amount = Double.parseDouble(payload.get("amount"));
            PaymentType type = PaymentType.valueOf(payload.get("type"));
            Payment payment = paymentService.createRazorpayOrder(loanId, amount, type);
            return ResponseEntity.ok(Map.of(
                "orderId", payment.getRazorpayOrderId(),
                "amount", amount * 100, // paise
                "paymentId", payment.getId(),
                "keyId", razorpayKeyId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyRazorpayPayment(@RequestBody Map<String, String> payload) {
        try {
            String orderId = payload.get("razorpay_order_id");
            String paymentId = payload.get("razorpay_payment_id");
            String signature = payload.get("razorpay_signature");
            
            Payment payment = paymentService.verifyRazorpayPayment(orderId, paymentId, signature);
            return ResponseEntity.ok(Map.of("status", "success", "payment", payment));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
