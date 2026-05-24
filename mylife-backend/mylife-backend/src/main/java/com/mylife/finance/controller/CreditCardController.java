package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.dto.request.CreditCardRequest;
import com.mylife.finance.dto.request.CreditCardTransactionRequest;
import com.mylife.finance.dto.request.PayInvoiceRequest;
import com.mylife.finance.dto.response.CreditCardResponse;
import com.mylife.finance.dto.response.CreditCardTransactionResponse;
import com.mylife.finance.dto.response.InvoiceResponse;
import com.mylife.finance.service.CreditCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance/credit-cards")
@RequiredArgsConstructor
@Tag(name = "Cartão de Crédito", description = "Gerenciamento de cartões, faturas e compras parceladas")
@SecurityRequirement(name = "bearerAuth")
public class CreditCardController {

    private final CreditCardService creditCardService;

    @Operation(summary = "Cadastrar cartão de crédito")
    @PostMapping
    public ResponseEntity<ApiResponse<CreditCardResponse>> createCard(
            @Valid @RequestBody CreditCardRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        creditCardService.createCard(request, user),
                        "Cartão cadastrado com sucesso."));
    }

    @Operation(summary = "Listar cartões — OWNER vê todos do grupo, MEMBER vê apenas os seus")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CreditCardResponse>>> findAllCards(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.findAllCards(user),
                "Cartões encontrados."));
    }

    @Operation(summary = "Buscar cartão por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CreditCardResponse>> findCardById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.findCardById(id, user),
                "Cartão encontrado."));
    }

    @Operation(summary = "Atualizar cartão")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CreditCardResponse>> updateCard(
            @PathVariable Long id,
            @Valid @RequestBody CreditCardRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.updateCard(id, request, user),
                "Cartão atualizado com sucesso."));
    }

    @Operation(summary = "Desativar cartão (bloqueado se houver faturas em aberto)")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateCard(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        creditCardService.deactivateCard(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Cartão desativado com sucesso."));
    }

    @Operation(summary = "Registrar compra — simples ou parcelada (até 48x). Aloca na fatura correta automaticamente.")
    @PostMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<CreditCardTransactionResponse>> addTransaction(
            @PathVariable Long id,
            @Valid @RequestBody CreditCardTransactionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        creditCardService.addTransaction(id, request, user),
                        "Compra registrada com sucesso."));
    }

    @Operation(summary = "Listar faturas do cartão")
    @GetMapping("/{id}/invoices")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> findInvoices(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.findInvoices(id, user),
                "Faturas encontradas."));
    }

    @Operation(summary = "Buscar fatura por mês (formato: yyyy-MM)")
    @GetMapping("/{id}/invoices/{yearMonth}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> findInvoiceByMonth(
            @PathVariable Long id,
            @PathVariable String yearMonth,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.findInvoiceByMonth(id, yearMonth, user),
                "Fatura encontrada."));
    }

    @Operation(summary = "Excluir lançamento — remove a compra e todas as suas parcelas restantes (não paga)")
    @DeleteMapping("/{id}/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @PathVariable Long id,
            @PathVariable Long transactionId,
            @AuthenticationPrincipal User user) {
        creditCardService.deleteTransaction(id, transactionId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Lançamento excluído com sucesso."));
    }

    @Operation(summary = "Pagar fatura — debita conta informada e gera Transaction(EXPENSE)")
    @PostMapping("/invoices/{invoiceId}/pay")
    public ResponseEntity<ApiResponse<InvoiceResponse>> payInvoice(
            @PathVariable Long invoiceId,
            @Valid @RequestBody PayInvoiceRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                creditCardService.payInvoice(invoiceId, request, user),
                "Fatura paga com sucesso."));
    }
}
