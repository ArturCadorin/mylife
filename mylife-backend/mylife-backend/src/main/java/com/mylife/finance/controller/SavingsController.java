package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.dto.request.SavingsEntryRequest;
import com.mylife.finance.dto.request.SavingsRequest;
import com.mylife.finance.dto.request.SavingsUpdateRequest;
import com.mylife.finance.dto.response.SavingsEntryResponse;
import com.mylife.finance.dto.response.SavingsResponse;
import com.mylife.finance.service.SavingsService;
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
@RequestMapping("/api/v1/finance/savings")
@RequiredArgsConstructor
@Tag(name = "Cofrinhos", description = "Gerenciamento de cofrinhos e reservas financeiras")
@SecurityRequirement(name = "bearerAuth")
public class SavingsController {

    private final SavingsService savingsService;

    @Operation(summary = "Criar cofrinho")
    @PostMapping
    public ResponseEntity<ApiResponse<SavingsResponse>> create(
            @Valid @RequestBody SavingsRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        savingsService.create(request, user),
                        "Cofrinho criado com sucesso."));
    }

    @Operation(summary = "Listar cofrinhos — OWNER vê todos do grupo, MEMBER vê apenas os seus")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SavingsResponse>>> findAll(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                savingsService.findAll(user, pageable),
                "Cofrinhos encontrados."));
    }

    @Operation(summary = "Buscar cofrinho por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingsResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                savingsService.findById(id, user),
                "Cofrinho encontrado."));
    }

    @Operation(summary = "Atualizar cofrinho")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingsResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody SavingsUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                savingsService.update(id, request, user),
                "Cofrinho atualizado com sucesso."));
    }

    @Operation(summary = "Excluir cofrinho (bloqueado se houver movimentações)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        savingsService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Cofrinho excluído com sucesso."));
    }

    @Operation(summary = "Registrar movimentação (depósito ou saque)")
    @PostMapping("/{id}/entries")
    public ResponseEntity<ApiResponse<SavingsEntryResponse>> addEntry(
            @PathVariable Long id,
            @Valid @RequestBody SavingsEntryRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        savingsService.addEntry(id, request, user),
                        "Movimentação registrada com sucesso."));
    }

    @Operation(summary = "Listar movimentações do cofrinho")
    @GetMapping("/{id}/entries")
    public ResponseEntity<ApiResponse<Page<SavingsEntryResponse>>> findEntries(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                savingsService.findEntries(id, user, pageable),
                "Movimentações encontradas."));
    }
}
