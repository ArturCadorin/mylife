package com.mylife.core.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.request.AddMemberRequest;
import com.mylife.core.dto.request.FamilyGroupRequest;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.core.dto.response.FamilyGroupResponse;
import com.mylife.core.service.FamilyGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/family-groups")
@RequiredArgsConstructor
@Tag(name = "Grupo Familiar", description = "Gerenciamento do grupo familiar e seus membros")
@SecurityRequirement(name = "bearerAuth")
public class FamilyGroupController {

    private final FamilyGroupService familyGroupService;

    @Operation(summary = "Criar grupo familiar")
    @PostMapping
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> create(
            @Valid @RequestBody FamilyGroupRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        familyGroupService.create(request, user),
                        "Grupo familiar criado com sucesso."));
    }

    @Operation(summary = "Buscar grupo familiar do usuário autenticado")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> findMine(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                familyGroupService.findMine(user),
                "Grupo familiar encontrado."));
    }

    @Operation(summary = "Buscar grupo familiar por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                familyGroupService.findById(id, user),
                "Grupo familiar encontrado."));
    }

    @Operation(summary = "Atualizar nome do grupo familiar")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody FamilyGroupRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                familyGroupService.update(id, request, user),
                "Grupo familiar atualizado com sucesso."));
    }

    @Operation(summary = "Excluir grupo familiar")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        familyGroupService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Grupo familiar excluído com sucesso."));
    }

    @Operation(summary = "Adicionar membro ao grupo familiar")
    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                familyGroupService.addMember(id, request.getEmail(), user),
                "Membro adicionado com sucesso."));
    }

    @Operation(summary = "Remover membro do grupo familiar")
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<FamilyGroupResponse>> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                familyGroupService.removeMember(id, userId, user),
                "Membro removido com sucesso."));
    }
}
