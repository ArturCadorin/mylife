package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class RecurrencePendingResponse {

    private Long id;
    private Long parentTransactionId;
    private String parentTransactionDescription;
    private TransactionType type;
    private TransactionCategory category;
    private BigDecimal amount;
    private LocalDate scheduledDate;
    private Long accountId;
    private String accountName;
    private Long ownerId;
    private String ownerName;
    private boolean confirmed;
    private LocalDateTime confirmedAt;
    private Long generatedTransactionId;
    private LocalDateTime createdAt;
}
