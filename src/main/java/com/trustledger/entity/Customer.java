package com.trustledger.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    // Personal Details
    private String dateOfBirth;
    private String gender;
    private String maritalStatus;

    // Address
    @Column(columnDefinition = "TEXT")
    private String addressLine1;
    
    @Column(columnDefinition = "TEXT")
    private String addressLine2;
    
    private String city;
    private String state;
    private String pinCode;

    // Additional Info
    private String occupation;
    private String monthlyIncome;
    private String identityProofType;
    
    @Column(unique = true)
    private String identityProofNumber;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;

    // Profile Photo
    private String photoUrl;

    @Column(unique = true)
    private String email;

    @Column
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    @Transient
    private String tempPassword;

    @Column(nullable = false)
    private boolean isFirstLogin = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
