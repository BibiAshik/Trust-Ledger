package com.trustledger.mapper;

import com.trustledger.dto.CustomerDto;
import com.trustledger.entity.Customer;

public final class CustomerMapper {

    private CustomerMapper() {
    }

    public static CustomerDto toDto(Customer customer) {
        if (customer == null) {
            return null;
        }

        return new CustomerDto(
                customer.getId(),
                customer.getName(),
                customer.getPhoneNumber(),
                customer.getDateOfBirth(),
                customer.getGender(),
                customer.getMaritalStatus(),
                customer.getAddressLine1(),
                customer.getAddressLine2(),
                customer.getCity(),
                customer.getState(),
                customer.getPinCode(),
                customer.getOccupation(),
                customer.getMonthlyIncome(),
                customer.getIdentityProofType(),
                customer.getIdentityProofNumber(),
                customer.getRemarks(),
                customer.getPhotoUrl(),
                customer.getEmail(),
                customer.getTempPassword(),
                customer.isFirstLogin(),
                customer.getCreatedAt()
        );
    }

    public static Customer toEntity(CustomerDto dto) {
        if (dto == null) {
            return null;
        }

        Customer customer = new Customer();
        customer.setId(dto.id());
        customer.setName(dto.name());
        customer.setPhoneNumber(dto.phoneNumber());
        customer.setDateOfBirth(dto.dateOfBirth());
        customer.setGender(dto.gender());
        customer.setMaritalStatus(dto.maritalStatus());
        customer.setAddressLine1(dto.addressLine1());
        customer.setAddressLine2(dto.addressLine2());
        customer.setCity(dto.city());
        customer.setState(dto.state());
        customer.setPinCode(dto.pinCode());
        customer.setOccupation(dto.occupation());
        customer.setMonthlyIncome(dto.monthlyIncome());
        customer.setIdentityProofType(dto.identityProofType());
        customer.setIdentityProofNumber(dto.identityProofNumber());
        customer.setRemarks(dto.remarks());
        customer.setPhotoUrl(dto.photoUrl());
        customer.setEmail(dto.email());
        customer.setTempPassword(dto.tempPassword());
        customer.setFirstLogin(dto.firstLogin());
        return customer;
    }
}
