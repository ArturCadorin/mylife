package com.mylife.finance.dto.response.report;

import com.mylife.finance.domain.enums.RecurrenceFrequency;
import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class RecurrenceProjectionResponse {

    private String description;
    private BigDecimal amount;
    private TransactionType type;
    private TransactionCategory category;
    private LocalDate expectedDate;
    private RecurrenceFrequency recurrenceFrequency;
    private String accountName;
    /** Preenchido apenas para faturas de cartão de crédito (null para recorrências normais) */
    private String creditCardName;
}
