package com.trustledger.service;

import com.trustledger.entity.Loan;
import com.trustledger.entity.LoanStatus;
import com.trustledger.entity.Payment;
import com.trustledger.entity.PaymentType;
import com.trustledger.repository.LoanRepository;
import com.trustledger.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private com.razorpay.RazorpayClient razorpayClient;

    @org.springframework.beans.factory.annotation.Value("${razorpay.key.secret}")
    private String razorpaySecret;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsForLoan(Long loanId) {
        return paymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId);
    }

    @Transactional
    public Payment makePayment(Long loanId, Double amount, PaymentType type) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        if (type == null) {
            throw new IllegalArgumentException("Payment type is required");
        }

        Optional<Loan> loanOpt = loanRepository.findById(loanId);
        if (loanOpt.isEmpty()) {
            throw new RuntimeException("Loan not found");
        }

        Loan loan = loanOpt.get();
        
        if (type == PaymentType.INTEREST) {
            double currentPending = loan.getTotalPendingInterest() != null ? loan.getTotalPendingInterest() : 0.0;
            double remaining = currentPending - amount;
            if(remaining < 0) remaining = 0.0;
            loan.setTotalPendingInterest(remaining);
        } else if (type == PaymentType.PRINCIPAL) {
            double currentPrincipal = loan.getRemainingPrincipal() != null ? loan.getRemainingPrincipal() : 0.0;
            double remaining = currentPrincipal - amount;
            if(remaining < 0) remaining = 0.0;
            loan.setRemainingPrincipal(remaining);
        } else if (type == PaymentType.FULL_CLOSURE) {
            loan.setRemainingPrincipal(0.0);
            loan.setTotalPendingInterest(0.0);
            loan.setStatus(LoanStatus.CLOSED);
        }

        double remainingPrincipal = loan.getRemainingPrincipal() != null ? loan.getRemainingPrincipal() : 0.0;
        double pendingInterest = loan.getTotalPendingInterest() != null ? loan.getTotalPendingInterest() : 0.0;
        if (remainingPrincipal <= 0 && pendingInterest <= 0) {
            loan.setStatus(LoanStatus.CLOSED);
        }

        loanRepository.save(loan);

        Payment payment = new Payment();
        payment.setLoan(loan);
        payment.setAmount(amount);
        payment.setType(type);
        payment.setPaymentMode(com.trustledger.entity.PaymentMode.CASH);
        return paymentRepository.save(payment);
    }
    
    @Transactional
    public Payment makeOnlinePayment(Long loanId, Double amount, PaymentType type, String razorpayPaymentId) {
        if (razorpayPaymentId == null || razorpayPaymentId.isEmpty()) {
            throw new IllegalArgumentException("Razorpay payment ID is required for online payments");
        }
        
        // Use the existing logic to update the loan balances
        Payment payment = makePayment(loanId, amount, type);
        payment.setPaymentMode(com.trustledger.entity.PaymentMode.ONLINE);
        payment.setRazorpayPaymentId(razorpayPaymentId);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment createRazorpayOrder(Long loanId, Double amount, PaymentType type) throws Exception {
        if (amount == null || amount <= 0) throw new IllegalArgumentException("Amount must be greater than zero");
        Optional<Loan> loanOpt = loanRepository.findById(loanId);
        if (loanOpt.isEmpty()) throw new RuntimeException("Loan not found");

        // Create order in Razorpay (amount is in paise)
        org.json.JSONObject orderRequest = new org.json.JSONObject();
        orderRequest.put("amount", (int)(amount * 100));
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);

        // Save a PENDING payment record
        Payment payment = new Payment();
        payment.setLoan(loanOpt.get());
        payment.setAmount(amount);
        payment.setType(type);
        payment.setPaymentMode(com.trustledger.entity.PaymentMode.ONLINE);
        payment.setRazorpayOrderId(razorpayOrder.get("id"));
        payment.setStatus("PENDING");
        
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment verifyRazorpayPayment(String orderId, String paymentId, String signature) throws Exception {
        // Find the pending payment
        Payment payment = paymentRepository.findAll().stream()
                .filter(p -> orderId.equals(p.getRazorpayOrderId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Payment order not found"));

        // Verify Signature
        org.json.JSONObject options = new org.json.JSONObject();
        options.put("razorpay_order_id", orderId);
        options.put("razorpay_payment_id", paymentId);
        options.put("razorpay_signature", signature);

        boolean isValid = com.razorpay.Utils.verifyPaymentSignature(options, razorpaySecret);
        if (!isValid) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            throw new RuntimeException("Invalid payment signature");
        }

        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setStatus("SUCCESS");
        
        // Update Loan Balance
        Loan loan = payment.getLoan();
        if (payment.getType() == PaymentType.INTEREST) {
            double currentPending = loan.getTotalPendingInterest() != null ? loan.getTotalPendingInterest() : 0.0;
            loan.setTotalPendingInterest(Math.max(0, currentPending - payment.getAmount()));
        } else if (payment.getType() == PaymentType.PRINCIPAL) {
            double currentPrincipal = loan.getRemainingPrincipal() != null ? loan.getRemainingPrincipal() : 0.0;
            loan.setRemainingPrincipal(Math.max(0, currentPrincipal - payment.getAmount()));
        } else if (payment.getType() == PaymentType.FULL_CLOSURE) {
            loan.setRemainingPrincipal(0.0);
            loan.setTotalPendingInterest(0.0);
            loan.setStatus(LoanStatus.CLOSED);
        }
        
        loanRepository.save(loan);
        return paymentRepository.save(payment);
    }
}
