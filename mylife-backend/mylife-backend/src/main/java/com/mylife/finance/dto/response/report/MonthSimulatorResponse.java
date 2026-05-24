package com.mylife.finance.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class MonthSimulatorResponse {

    private String month;

    // ── Patrimônio atual ──────────────────────────────────────────────────────
    private BigDecimal netWorth;
    private BigDecimal totalAccounts;
    private BigDecimal totalSavings;
    private BigDecimal totalInvestments;
    private BigDecimal totalCreditCardDebt;

    // ── Itens confirmados do mês ──────────────────────────────────────────────
    private List<SimulatorItemResponse> confirmedIncome;
    private List<SimulatorItemResponse> confirmedExpenses;

    // ── Recorrências previstas (ainda não lançadas este mês) ──────────────────
    private List<SimulatorItemResponse> pendingRecurringIncome;
    private List<SimulatorItemResponse> pendingRecurringExpenses;

    // ── Faturas de cartão que vencem neste mês ────────────────────────────────
    private List<CreditCardDueItem> creditCardDueItems;

    // ── Totais calculados ─────────────────────────────────────────────────────
    private BigDecimal totalConfirmedIncome;
    private BigDecimal totalConfirmedExpenses;
    private BigDecimal totalPendingIncome;
    private BigDecimal totalPendingExpenses;
    private BigDecimal totalCreditCardDueThisMonth;

    /** Receita total projetada = confirmada + recorrências pendentes */
    private BigDecimal totalProjectedIncome;

    /** Despesa total projetada = confirmada + recorrências pendentes + faturas CC */
    private BigDecimal totalProjectedExpenses;

    /** Saldo do mês = receita projetada − despesa projetada */
    private BigDecimal projectedMonthBalance;

    /** Patrimônio projetado ao fim do mês = patrimônio atual + renda pendente − despesas pendentes − CC vencendo */
    private BigDecimal projectedNetWorth;
}
