package com.trustledger.service;

import com.trustledger.entity.Customer;
import com.trustledger.entity.PasswordResetToken;
import com.trustledger.entity.User;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.repository.PasswordResetTokenRepository;
import com.trustledger.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetTokenService {

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ============================
    // MODERATE: Initiate Reset
    // ============================
    @Transactional
    public boolean initiateReset(String email) {
        String userType = null;

        User adminUser = userRepository.findByEmail(email);
        if (adminUser != null) {
            userType = "ADMIN";
        } else {
            Optional<Customer> customer = customerRepository.findByEmail(email);
            if (customer.isPresent()) {
                userType = "CUSTOMER";
            }
        }

        if (userType == null) {
            return true;
        }

        tokenRepository.deleteByEmail(email);

        PasswordResetToken token = new PasswordResetToken();
        token.setToken(UUID.randomUUID().toString());
        token.setEmail(email);
        token.setUserType(userType);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        try {
            sendResetEmail(email, token.getToken());
        } catch (MailException e) {
            // Local/demo runs often use placeholder SMTP credentials.
        }
        return true;
    }

    // ============================
    // TOUGH: Reset Password
    // ============================
    @Transactional
    public boolean resetPassword(String tokenStr, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(tokenStr);
        if (tokenOpt.isEmpty())
            return false;

        PasswordResetToken token = tokenOpt.get();
        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        String email = token.getEmail();
        String encodedPassword = passwordEncoder.encode(newPassword);

        if ("ADMIN".equals(token.getUserType())) {
            User user = userRepository.findByEmail(email);
            if (user == null)
                return false;
            user.setPassword(encodedPassword);
            userRepository.save(user);
        } else {
            Optional<Customer> customerOpt = customerRepository.findByEmail(email);
            if (customerOpt.isEmpty())
                return false;
            Customer customer = customerOpt.get();
            customer.setPassword(encodedPassword);
            customer.setFirstLogin(false);
            customerRepository.save(customer);
        }

        token.setUsed(true);
        tokenRepository.save(token);
        return true;
    }

    // ============================
    // TOUGH / EXTERNAL: Send Email
    // ============================
    private void sendResetEmail(String toEmail, String token) {
        String resetLink = baseUrl + "/shop-owner/reset-password.html?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Trust Ledger — Password Reset");
        message.setText(
                "Hello,\n\n" +
                        "You requested to reset your Trust Ledger password.\n\n" +
                        "Click the link below to set a new password. This link expires in 1 hour:\n\n" +
                        resetLink + "\n\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "— Trust Ledger");
        mailSender.send(message);
    }
}