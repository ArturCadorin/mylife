package com.mylife.finance.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class BalanceEntryResponse {

    private LocalDate date;
    private BigDecimal balance;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
}
