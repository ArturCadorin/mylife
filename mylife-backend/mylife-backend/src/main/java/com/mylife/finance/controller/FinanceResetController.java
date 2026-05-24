package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.service.FinanceResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance/data")
@RequiredArgsConstructor
@Tag(name = "Finance Reset", description = "Operações de reset de dados financeiros")
@SecurityRequirement(name = "bearerAuth")
public class FinanceResetController {

    private final FinanceResetService financeResetService;

    @Operation(summary = "Zerar todas as movimentações financeiras",
               description = "Remove todas as transações, lançamentos de cofrinhos, investimentos, faturas de cartão " +
                             "e zera os saldos de contas. Mantém as contas, cartões, cofrinhos e investimentos cadastrados.")
    @DeleteMapping("/reset")
    public ResponseEntity<ApiResponse<Void>> resetFinancialData(
            @AuthenticationPrincipal User user) {
        financeResetService.resetFinancialData(user);
        return ResponseEntity.ok(ApiResponse.success(null, "Dados financeiros zerados com sucesso."));
    }
}
