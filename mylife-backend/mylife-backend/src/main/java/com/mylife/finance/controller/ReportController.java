package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.domain.enums.TransactionType;
import com.mylife.finance.dto.response.report.*;
import com.mylife.finance.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/finance/reports")
@RequiredArgsConstructor
@Tag(name = "Relatórios", description = "Visões agregadas e análises financeiras")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "Visão financeira geral — saldos, cofrinhos e dívida de cartão")
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<FinancialOverviewResponse>> getOverview(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getFinancialOverview(user),
                "Visão geral obtida com sucesso."));
    }

    @Operation(summary = "Resumo mensal — receitas, despesas e saldo do período (formato: yyyy-MM)")
    @GetMapping("/monthly-summary")
    public ResponseEntity<ApiResponse<MonthlySummaryResponse>> getMonthlySummary(
            @RequestParam String month,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getMonthlySummary(month, user),
                "Resumo mensal obtido com sucesso."));
    }

    @Operation(summary = "Gastos por categoria no período (formato: yyyy-MM). Parâmetro type: INCOME ou EXPENSE")
    @GetMapping("/category-summary")
    public ResponseEntity<ApiResponse<List<CategorySummaryResponse>>> getCategorySummary(
            @RequestParam String month,
            @RequestParam(defaultValue = "EXPENSE") TransactionType type,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getCategorySummary(month, type, user),
                "Resumo por categoria obtido com sucesso."));
    }

    @Operation(summary = "Evolução de saldo da conta por dia no período (datas no formato: yyyy-MM-dd)")
    @GetMapping("/account-evolution/{accountId}")
    public ResponseEntity<ApiResponse<AccountBalanceEvolutionResponse>> getAccountEvolution(
            @PathVariable Long accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getAccountBalanceEvolution(accountId, from, to, user),
                "Evolução de saldo obtida com sucesso."));
    }

    @Operation(summary = "Comparativo mês informado vs mês anterior (formato: yyyy-MM)")
    @GetMapping("/monthly-comparison")
    public ResponseEntity<ApiResponse<MonthlyComparisonResponse>> getMonthlyComparison(
            @RequestParam String month,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getMonthlyComparison(month, user),
                "Comparativo mensal obtido com sucesso."));
    }

    @Operation(summary = "Projeção de transações recorrentes futuras")
    @GetMapping("/recurrence-projection")
    public ResponseEntity<ApiResponse<List<RecurrenceProjectionResponse>>> getRecurrenceProjection(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getRecurrenceProjection(user),
                "Projeção de recorrências obtida com sucesso."));
    }
}
