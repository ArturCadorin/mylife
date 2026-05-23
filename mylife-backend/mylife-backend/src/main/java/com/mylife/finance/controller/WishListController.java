package com.mylife.finance.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.finance.domain.enums.WishListStatus;
import com.mylife.finance.dto.request.PurchaseRequest;
import com.mylife.finance.dto.request.WishListItemRequest;
import com.mylife.finance.dto.request.WishListItemUpdateRequest;
import com.mylife.finance.dto.response.WishListItemResponse;
import com.mylife.finance.service.WishListService;
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
@RequestMapping("/api/v1/finance/wishlist")
@RequiredArgsConstructor
@Tag(name = "Lista de Desejos", description = "Gerenciamento de itens planejados para compra")
@SecurityRequirement(name = "bearerAuth")
public class WishListController {

    private final WishListService wishListService;

    @Operation(summary = "Criar item na lista de desejos")
    @PostMapping
    public ResponseEntity<ApiResponse<WishListItemResponse>> create(
            @Valid @RequestBody WishListItemRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        wishListService.create(request, user),
                        "Item criado com sucesso."));
    }

    @Operation(summary = "Listar itens — OWNER vê todos do grupo, MEMBER vê apenas os seus. Filtro opcional: status")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<WishListItemResponse>>> findAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) WishListStatus status,
            @PageableDefault(size = 20, sort = "estimatedMonth", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                wishListService.findAll(user, status, pageable),
                "Itens encontrados."));
    }

    @Operation(summary = "Buscar item por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WishListItemResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                wishListService.findById(id, user),
                "Item encontrado."));
    }

    @Operation(summary = "Atualizar item (apenas se status = PENDING)")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WishListItemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WishListItemUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                wishListService.update(id, request, user),
                "Item atualizado com sucesso."));
    }

    @Operation(summary = "Marcar item como comprado (apenas se status = PENDING)")
    @PatchMapping("/{id}/purchase")
    public ResponseEntity<ApiResponse<WishListItemResponse>> markAsPurchased(
            @PathVariable Long id,
            @RequestBody(required = false) PurchaseRequest request,
            @AuthenticationPrincipal User user) {
        PurchaseRequest req = request != null ? request : new PurchaseRequest();
        return ResponseEntity.ok(ApiResponse.success(
                wishListService.markAsPurchased(id, req, user),
                "Item marcado como comprado."));
    }

    @Operation(summary = "Cancelar item (apenas se status = PENDING)")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<WishListItemResponse>> markAsCancelled(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                wishListService.markAsCancelled(id, user),
                "Item cancelado com sucesso."));
    }

    @Operation(summary = "Excluir item (apenas se status = PENDING)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        wishListService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Item excluído com sucesso."));
    }
}
