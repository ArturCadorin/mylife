package com.mylife.finance.dto.response.report;

import com.mylife.finance.dto.response.AccountResponse;
import com.mylife.finance.dto.response.SavingsResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class FinancialOverviewResponse {

    private BigDecimal totalBalanceAllAccounts;
    private BigDecimal totalSavings;
    private BigDecimal totalInvestments;
    private BigDecimal totalCreditCardDebt;
    private BigDecimal netWorth;
    private BigDecimal currentMonthIncome;
    private BigDecimal currentMonthExpenses;
    private BigDecimal currentMonthBalance;
    private List<AccountResponse> accountSummaries;
    private List<SavingsResponse> savingsSummaries;
}
