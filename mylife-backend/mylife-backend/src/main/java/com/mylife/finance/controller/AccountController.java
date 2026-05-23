package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.dto.request.AccountRequest;
import com.mylife.finance.dto.request.AccountUpdateRequest;
import com.mylife.finance.dto.response.AccountResponse;
import com.mylife.finance.service.AccountService;
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
@RequestMapping("/api/v1/finance/accounts")
@RequiredArgsConstructor
@Tag(name = "Contas", description = "Gerenciamento de contas bancárias")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    @Operation(summary = "Criar conta bancária")
    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> create(
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        accountService.create(request, user),
                        "Conta criada com sucesso."));
    }

    @Operation(summary = "Listar contas — OWNER vê todas do grupo, MEMBER vê apenas as suas")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccountResponse>>> findAll(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                accountService.findAll(user, pageable),
                "Contas encontradas."));
    }

    @Operation(summary = "Buscar conta por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                accountService.findById(id, user),
                "Conta encontrada."));
    }

    @Operation(summary = "Atualizar dados da conta")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AccountUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                accountService.update(id, request, user),
                "Conta atualizada com sucesso."));
    }

    @Operation(summary = "Desativar conta (soft delete)")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        accountService.deactivate(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Conta desativada com sucesso."));
    }

    @Operation(summary = "Excluir conta")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        accountService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Conta excluída com sucesso."));
    }
}
