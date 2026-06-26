package com.trustledger.repository;

import com.trustledger.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByNameContainingIgnoreCase(String name);
    List<Customer> findByPhoneNumberContaining(String phoneNumber);
    java.util.Optional<Customer> findByPhoneNumber(String phoneNumber);
    java.util.Optional<Customer> findByPhoneNumberOrEmail(String phoneNumber, String email);
    java.util.Optional<Customer> findByEmail(String email);
}
