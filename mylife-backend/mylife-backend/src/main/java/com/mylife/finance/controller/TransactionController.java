package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.domain.enums.TransactionType;
import com.mylife.finance.dto.request.ConfirmRecurrenceRequest;
import com.mylife.finance.dto.request.TransactionRequest;
import com.mylife.finance.dto.request.TransactionUpdateRequest;
import com.mylife.finance.dto.response.RecurrencePendingResponse;
import com.mylife.finance.dto.response.TransactionResponse;
import com.mylife.finance.service.TransactionService;
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

@RestController
@RequestMapping("/api/v1/finance/transactions")
@RequiredArgsConstructor
@Tag(name = "Transações", description = "Lançamentos financeiros de receitas e despesas")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    @Operation(summary = "Criar transação (comum ou recorrente)")
    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        transactionService.create(request, user),
                        "Transação criada com sucesso."));
    }

    @Operation(summary = "Listar transações — OWNER vê todas do grupo, MEMBER vê apenas as suas. Filtros: type, accountId")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> findAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long accountId,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.findAll(user, type, accountId, pageable),
                "Transações encontradas."));
    }

    @Operation(summary = "Buscar transação por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.findById(id, user),
                "Transação encontrada."));
    }

    @Operation(summary = "Atualizar transação (não permitido em recorrentes-pai)")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.update(id, request, user),
                "Transação atualizada com sucesso."));
    }

    @Operation(summary = "Excluir transação (reverte o saldo para transações não-recorrentes)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        transactionService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Transação excluída com sucesso."));
    }

    @Operation(summary = "Listar recorrências pendentes de confirmação (apenas MANUAL)")
    @GetMapping("/pending-recurrences")
    public ResponseEntity<ApiResponse<Page<RecurrencePendingResponse>>> findPendingNotifications(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "scheduledDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.findPendingNotifications(user, pageable),
                "Recorrências pendentes encontradas."));
    }

    @Operation(summary = "Confirmar recorrência pendente — gera a transação e atualiza o saldo")
    @PostMapping("/pending-recurrences/{id}/confirm")
    public ResponseEntity<ApiResponse<TransactionResponse>> confirmRecurrence(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmRecurrenceRequest request,
            @AuthenticationPrincipal User user) {
        ConfirmRecurrenceRequest req = request != null ? request : new ConfirmRecurrenceRequest();
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.confirmRecurrence(id, req, user),
                "Recorrência confirmada com sucesso."));
    }
}
