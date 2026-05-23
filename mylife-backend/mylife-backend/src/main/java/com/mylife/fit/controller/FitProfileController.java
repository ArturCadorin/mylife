package com.mylife.fit.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.fit.dto.request.FitProfileRequest;
import com.mylife.fit.dto.response.FitProfileResponse;
import com.mylife.fit.service.FitProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fit/profile")
@RequiredArgsConstructor
@Tag(name = "Fit — Perfil", description = "Perfil físico e de saúde do usuário")
@SecurityRequirement(name = "bearerAuth")
public class FitProfileController {

    private final FitProfileService fitProfileService;

    @Operation(summary = "Obter perfil físico (cria automaticamente se não existir)")
    @GetMapping
    public ResponseEntity<ApiResponse<FitProfileResponse>> get(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                fitProfileService.getOrCreate(user),
                "Perfil encontrado."));
    }

    @Operation(summary = "Atualizar perfil físico")
    @PutMapping
    public ResponseEntity<ApiResponse<FitProfileResponse>> upsert(
            @Valid @RequestBody FitProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                fitProfileService.upsert(request, user),
                "Perfil atualizado com sucesso."));
    }
}
