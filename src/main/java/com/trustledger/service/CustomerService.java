package com.trustledger.service;

import com.trustledger.entity.Customer;
import com.trustledger.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

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
}
