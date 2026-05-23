package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.domain.enums.InvestmentType;
import com.mylife.finance.dto.request.InvestmentEntryRequest;
import com.mylife.finance.dto.request.InvestmentRequest;
import com.mylife.finance.dto.request.InvestmentUpdateRequest;
import com.mylife.finance.dto.response.InvestmentEntryResponse;
import com.mylife.finance.dto.response.InvestmentResponse;
import com.mylife.finance.dto.response.report.InvestmentSummaryResponse;
import com.mylife.finance.service.InvestmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance/investments")
@RequiredArgsConstructor
@Tag(name = "Investimentos", description = "Gerenciamento de investimentos e movimentações")
@SecurityRequirement(name = "bearerAuth")
public class InvestmentController {

    private final InvestmentService investmentService;

    @Operation(summary = "Resumo consolidado de investimentos")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<InvestmentSummaryResponse>> getSummary(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                investmentService.getInvestmentSummary(user),
                "Resumo de investimentos obtido com sucesso."));
    }

    @Operation(summary = "Cadastrar investimento — cria aporte inicial automaticamente")
    @PostMapping
    public ResponseEntity<ApiResponse<InvestmentResponse>> create(
            @Valid @RequestBody InvestmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        investmentService.create(request, user),
                        "Investimento cadastrado com sucesso."));
    }

    @Operation(summary = "Listar investimentos ativos — filtro opcional por tipo")
    @GetMapping
    public ResponseEntity<ApiResponse<List<InvestmentResponse>>> findAll(
            @RequestParam(required = false) InvestmentType type,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                investmentService.findAll(user, type),
                "Investimentos encontrados."));
    }

    @Operation(summary = "Buscar investimento por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvestmentResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                investmentService.findById(id, user),
                "Investimento encontrado."));
    }

    @Operation(summary = "Atualizar dados descritivos e taxas do investimento")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InvestmentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody InvestmentUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                investmentService.update(id, request, user),
                "Investimento atualizado com sucesso."));
    }

    @Operation(summary = "Desativar investimento (bloqueado se currentValue > 0)")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        investmentService.deactivate(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Investimento desativado com sucesso."));
    }

    @Operation(summary = "Registrar movimentação: DEPOSIT, WITHDRAWAL ou YIELD_UPDATE")
    @PostMapping("/{id}/entries")
    public ResponseEntity<ApiResponse<InvestmentEntryResponse>> addEntry(
            @PathVariable Long id,
            @Valid @RequestBody InvestmentEntryRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        investmentService.addEntry(id, request, user),
                        "Movimentação registrada com sucesso."));
    }

    @Operation(summary = "Listar movimentações do investimento")
    @GetMapping("/{id}/entries")
    public ResponseEntity<ApiResponse<Page<InvestmentEntryResponse>>> findEntries(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                investmentService.findEntries(id, user, pageable),
                "Movimentações encontradas."));
    }
}
