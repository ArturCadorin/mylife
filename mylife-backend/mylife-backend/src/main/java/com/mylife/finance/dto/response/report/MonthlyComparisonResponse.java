package com.mylife.finance.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MonthlyComparisonResponse {

    private String currentMonth;
    private String previousMonth;

    private BigDecimal currentIncome;
    private BigDecimal previousIncome;
    private BigDecimal incomeVariation;

    private BigDecimal currentExpense;
    private BigDecimal previousExpense;
    private BigDecimal expenseVariation;

    private BigDecimal currentBalance;
    private BigDecimal previousBalance;
    private BigDecimal balanceVariation;
}
