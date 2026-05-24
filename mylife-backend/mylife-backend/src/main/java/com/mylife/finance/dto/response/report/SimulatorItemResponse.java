package com.mylife.finance.dto.response.report;

import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class SimulatorItemResponse {

    private String description;
    private BigDecimal amount;
    private TransactionType type;
    private TransactionCategory category;
    private LocalDate date;
    private String accountName;
    private boolean confirmed;
}
