package com.trustledger.service;

import com.trustledger.config.JwtUtils;
import com.trustledger.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomerRepository customerRepository;

    // ============================
    // EASY: Get Current User
    // ============================
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
    // TOUGH: Authenticate User
    // ============================
    public Map<String, Object> authenticateUser(String username, String password) throws AuthenticationException {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        String role = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .findFirst().orElse("ROLE_USER");

        String principal = authentication.getName();
        String token = jwtUtils.generateToken(principal, role);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", role);

        if ("ROLE_CUSTOMER".equals(role)) {
            customerRepository.findByPhoneNumber(principal).ifPresent(c -> {
                response.put("isFirstLogin", c.isFirstLogin());
                response.put("username", c.getName());
            });
        } else {
            response.put("username", principal);
            response.put("isFirstLogin", false);
        }

        return response;
    }
}
