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

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }
    
   public List<Customer> searchCustomers(String query) {
    List<Customer> byName = customerRepository.findByNameContainingIgnoreCase(query);
    List<Customer> byPhone = customerRepository.findByPhoneNumberContaining(query);
    byName.addAll(byPhone);
    return byName.stream().distinct().toList();
}



    
}
