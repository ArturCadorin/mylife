package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.TransactionCategory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditCardTransactionResponse {

    private Long id;
    private Long creditCardId;
    private String creditCardName;
    private Long invoiceId;
    private String invoiceReferenceMonth;
    private String description;
    private BigDecimal totalAmount;
    private BigDecimal installmentAmount;
    private Integer installmentNumber;
    private Integer totalInstallments;
    private TransactionCategory category;
    private LocalDate purchaseDate;
    private String note;
    private boolean lastInstallment;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
}
