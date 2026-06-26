package com.trustledger.mapper;

import com.trustledger.dto.LoanDto;
import com.trustledger.entity.Customer;
import com.trustledger.entity.Loan;

public final class LoanMapper {

    private LoanMapper() {
    }

    public static LoanDto toDto(Loan loan) {
        if (loan == null) {
            return null;
        }

        Customer customer = loan.getCustomer();
        Long customerId = customer != null ? customer.getId() : null;

        return new LoanDto(
                loan.getId(),
                customerId,
                CustomerMapper.toDto(customer),
                loan.getItemType(),
                loan.getNumberOfItems(),
                loan.getWeight(),
                loan.getGrossWeight(),
                loan.getPurity(),
                loan.getEstimatedValue(),
                loan.getLoanAmount(),
                loan.getRemainingPrincipal(),
                loan.getInterestPercentage(),
                loan.getTotalPendingInterest(),
                loan.getLoanDate(),
                loan.getDueDate(),
                loan.getRenewedDate(),
                loan.getLoanPeriod(),
                loan.getRenewalCount(),
                loan.getStatus(),
                loan.getRemarks(),
                loan.getGoldPhotoUrls(),
                loan.getDocumentUrls(),
                loan.getLastInterestCalculatedDate(),
                loan.getCreatedAt()
        );
    }

    public static Loan toEntity(LoanDto dto, Customer customer) {
        if (dto == null) {
            return null;
        }

        Loan loan = new Loan();
        loan.setId(dto.id());
        loan.setCustomer(customer);
        loan.setItemType(dto.itemType());
        loan.setNumberOfItems(dto.numberOfItems());
        loan.setWeight(dto.weight());
        loan.setGrossWeight(dto.grossWeight());
        loan.setPurity(dto.purity());
        loan.setEstimatedValue(dto.estimatedValue());
        loan.setLoanAmount(dto.loanAmount());
        loan.setRemainingPrincipal(dto.remainingPrincipal());
        loan.setInterestPercentage(dto.interestPercentage());
        loan.setTotalPendingInterest(dto.totalPendingInterest());
        loan.setLoanDate(dto.loanDate());
        loan.setDueDate(dto.dueDate());
        loan.setRenewedDate(dto.renewedDate());
        loan.setLoanPeriod(dto.loanPeriod());
        loan.setRenewalCount(dto.renewalCount());
        loan.setStatus(dto.status());
        loan.setRemarks(dto.remarks());
        loan.setGoldPhotoUrls(dto.goldPhotoUrls());
        loan.setDocumentUrls(dto.documentUrls());
        loan.setLastInterestCalculatedDate(dto.lastInterestCalculatedDate());
        return loan;
    }
}
