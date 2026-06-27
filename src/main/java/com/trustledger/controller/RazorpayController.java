package com.trustledger.controller;

import com.razorpay.RazorpayException;
import com.trustledger.entity.PaymentType;
import com.trustledger.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class RazorpayController {

    @Autowired
    private RazorpayService razorpayService;

    // ============================
    // MODERATE: POST /api/payment/create-order
    // ============================
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) {
        try {
            double amount = Double.parseDouble(data.get("amount").toString());
            Map<String, Object> response = razorpayService.createOrder(amount);
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ============================
    // MODERATE: POST /api/payment/verify
    // ============================
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data) {
        try {
            String razorpayOrderId = data.get("razorpay_order_id");
            String razorpayPaymentId = data.get("razorpay_payment_id");
            String razorpaySignature = data.get("razorpay_signature");
            
            Long loanId = Long.parseLong(data.get("loanId"));
            Double amount = Double.parseDouble(data.get("amount"));
            PaymentType type = PaymentType.valueOf(data.get("type"));

            boolean status = razorpayService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, loanId, amount, type);
            
            if (status) {
                return ResponseEntity.ok(Map.of("status", "success"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Payment verification failed"));
            }
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
