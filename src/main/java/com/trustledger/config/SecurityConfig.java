package com.trustledger.config;

import com.trustledger.entity.Customer;
import com.trustledger.repository.CustomerRepository;
import com.trustledger.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Optional;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtUtils jwtUtils;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository,
                                                 CustomerRepository customerRepository) {
        return username -> {
            com.trustledger.entity.User adminUser = userRepository.findByUsername(username);
            if (adminUser != null) {
                return User.builder()
                        .username(adminUser.getUsername())
                        .password(adminUser.getPassword())
                        .roles(adminUser.getRole().replace("ROLE_", ""))
                        .build();
            }

            Optional<Customer> customerOpt = customerRepository.findByPhoneNumberOrEmail(username, username);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                return User.builder()
                        .username(customer.getPhoneNumber())
                        .password(customer.getPassword() != null ? customer.getPassword() : "")
                        .roles("CUSTOMER")
                        .build();
            }

            throw new UsernameNotFoundException("User not found: " + username);
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/css/**", "/js/**", "/images/**",
                                "/favicon.ico", "/error",
                                "/uploads/**"
                        ).permitAll()
                        .requestMatchers(AntPathRequestMatcher.antMatcher("/**/*.html")).permitAll()
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/customer-portal/**").hasAuthority("ROLE_CUSTOMER")
                        .requestMatchers("/api/payments/create-order", "/api/payments/verify", "/api/payments/*/receipt", "/api/payments/loan/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_CUSTOMER")
                        .requestMatchers(
                                "/api/customers/**",
                                "/api/loans/**",
                                "/api/payments/**",
                                "/api/dashboard/**",
                                "/api/files/**"
                        ).hasAuthority("ROLE_ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"authenticated\":false,\"error\":\"Unauthorized\"}");
                }))
                .addFilterBefore(new JwtAuthFilter(jwtUtils), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
