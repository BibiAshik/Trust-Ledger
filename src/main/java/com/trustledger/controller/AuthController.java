package com.trustledger.controller;

import com.trustledger.config.JwtUtils;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordResetService passwordResetService;

    // ============================
    // POST /api/auth/login
    // ============================
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.getOrDefault("username", "").trim();
        String password = credentials.getOrDefault("password", "");

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password are required"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            String role = authentication.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .findFirst().orElse("ROLE_USER");

            // The principal name stored in JWT is the phone number for customers.
            String principal = authentication.getName();

            String token = jwtUtils.generateToken(principal, role);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", role);

            if ("ROLE_CUSTOMER".equals(role)) {
                // principal is always the phone number (set by UserDetailsService)
                customerRepository.findByPhoneNumber(principal).ifPresent(c -> {
                    response.put("isFirstLogin", c.isFirstLogin());
                    response.put("username", c.getName());
                });
            } else {
                response.put("username", principal);
                response.put("isFirstLogin", false);
            }

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }

    // ============================
    // GET /api/auth/me
    // ============================
    @GetMapping("/me")
    public Map<String, Object> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        if (authentication != null && authentication.isAuthenticated()
                && !authentication.getPrincipal().equals("anonymousUser")) {
            response.put("authenticated", true);
            response.put("username", authentication.getName());
            String role = authentication.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .findFirst().orElse("");
            response.put("role", role);
            if ("ROLE_CUSTOMER".equals(role)) {
                customerRepository.findByPhoneNumber(authentication.getName())
                        .ifPresent(c -> response.put("isFirstLogin", c.isFirstLogin()));
            }
        } else {
            response.put("authenticated", false);
        }
        return response;
    }

    // ============================
    // POST /api/auth/forgot-password
    // ============================
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        // Always return success (don't reveal if email exists)
        passwordResetService.initiateReset(email.trim());
        return ResponseEntity.ok(Map.of("message", "If that email is registered, a reset link has been sent."));
    }

    // ============================
    // POST /api/auth/reset-password
    // ============================
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Token and a password of at least 6 characters are required"));
        }

        boolean success = passwordResetService.resetPassword(token, newPassword);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired reset link. Please request a new one."));
        }
    }
}
