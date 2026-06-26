package com.trustledger.service;

import com.trustledger.entity.Customer;
import com.trustledger.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public List<Customer> searchCustomers(String query) {
        List<Customer> byName = customerRepository.findByNameContainingIgnoreCase(query);
        List<Customer> byPhone = customerRepository.findByPhoneNumberContaining(query);
        byName.addAll(byPhone);
        return byName.stream().distinct().toList();
    }

    public Customer saveCustomer(Customer customer) {
        if (customer.getEmail() != null && customer.getEmail().trim().isEmpty()) {
            customer.setEmail(null);
        }
        if (customer.getIdentityProofNumber() != null && customer.getIdentityProofNumber().trim().isEmpty()) {
            customer.setIdentityProofNumber(null);
        }
        
        if (customer.getId() == null) {
            String phone = customer.getPhoneNumber();
            String tempPassword = "TL" + (phone.length() >= 4 ? phone.substring(phone.length() - 4) : phone);
            customer.setPassword(passwordEncoder.encode(tempPassword));
            customer.setFirstLogin(true);
            Customer saved = customerRepository.save(customer);
            saved.setTempPassword(tempPassword); // Returning temp password for the UI to show once

            // Send email with temporary password if email is provided
            if (saved.getEmail() != null && !saved.getEmail().trim().isEmpty()) {
                sendWelcomeEmail(saved, tempPassword);
            }

            return saved;
        }
        return customerRepository.save(customer);
    }
    
    public void changePassword(Long customerId, String newPassword) {
        Customer customer = customerRepository.findById(customerId).orElseThrow();
        customer.setPassword(passwordEncoder.encode(newPassword));
        customer.setFirstLogin(false);
        customerRepository.save(customer);
    }

    private void sendWelcomeEmail(Customer customer, String tempPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(customer.getEmail());
            message.setSubject("Welcome to Trust Ledger - Your Account Details");
            message.setText("Dear " + customer.getName() + ",\n\n" +
                    "Your account has been successfully created.\n\n" +
                    "Your login credentials are:\n" +
                    "Phone Number: " + customer.getPhoneNumber() + "\n" +
                    "Temporary Password: " + tempPassword + "\n\n" +
                    "Please log in and change your password immediately.\n\n" +
                    "Thank you,\nTrust Ledger Team");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send welcome email to " + customer.getEmail() + ": " + e.getMessage());
        }
    }
}
