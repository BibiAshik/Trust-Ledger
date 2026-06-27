package com.trustledger.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.trustledger.entity.Loan;
import com.trustledger.entity.PaymentType;
import com.trustledger.repository.LoanRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id:rzp_test_dummy}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:dummy_secret}")
    private String razorpayKeySecret;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private LoanRepository loanRepository;

    // ============================
    // TOUGH: Create Razorpay Order
    // ============================
    public Map<String, Object> createOrder(double amount) throws RazorpayException {
        RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", (int) (amount * 100)); // amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        Order order = client.orders.create(orderRequest);
        
        Map<String, Object> response = new HashMap<>();
        response.put("orderId", order.get("id"));
        response.put("amount", order.get("amount"));
        response.put("keyId", razorpayKeyId);

        return response;
    }

    // ============================
    // TOUGH: Verify Payment Signature
    // ============================
    public boolean verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature, Long loanId, Double amount, PaymentType type) throws Exception {
        if (!canRecordPaymentForLoan(loanId)) {
            throw new SecurityException("You are not allowed to pay this loan");
        }

        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", razorpayOrderId);
        options.put("razorpay_payment_id", razorpayPaymentId);
        options.put("razorpay_signature", razorpaySignature);

        boolean status = Utils.verifyPaymentSignature(options, razorpayKeySecret);
        
        if (status) {
            paymentService.makeOnlinePayment(loanId, amount, type, razorpayPaymentId);
            return true;
        } else {
            return false;
        }
    }

    // ============================
    // TOUGH: Helper for Authorization
    // ============================
    private boolean canRecordPaymentForLoan(Long loanId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return true;
        }

        boolean isCustomer = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CUSTOMER".equals(a.getAuthority()));
        if (!isCustomer) {
            return false;
        }

        Optional<Loan> loan = loanRepository.findById(loanId);
        if (loan.isEmpty() || loan.get().getCustomer() == null) {
            return false;
        }

        String principal = auth.getName();
        Loan customerLoan = loan.get();
        return principal.equals(customerLoan.getCustomer().getPhoneNumber())
                || principal.equals(customerLoan.getCustomer().getEmail());
    }
}
