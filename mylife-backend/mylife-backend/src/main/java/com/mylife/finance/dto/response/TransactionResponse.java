package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.RecurrenceFrequency;
import com.mylife.finance.domain.enums.RecurrenceType;
import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {

    private Long id;
    private TransactionType type;
    private TransactionCategory category;
    private BigDecimal amount;
    private LocalDate date;
    private String description;
    private String note;
    private Long accountId;
    private String accountName;
    private Long ownerId;
    private String ownerName;
    private RecurrenceType recurrenceType;
    private RecurrenceFrequency recurrenceFrequency;
    private Integer recurrenceTotalCount;
    private Integer recurrenceCurrentCount;
    private LocalDate nextOccurrenceDate;
    private Long parentTransactionId;
    private boolean pending;
    private LocalDateTime createdAt;
}
