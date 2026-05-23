package com.mylife.finance.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MonthlySummaryResponse {

    private String referenceMonth;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private BigDecimal totalCreditCardSpending;
    private BigDecimal netBalance;
}
