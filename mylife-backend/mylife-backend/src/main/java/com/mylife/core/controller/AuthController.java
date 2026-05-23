package com.mylife.core.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.request.ChangePasswordRequest;
import com.mylife.core.dto.request.LoginRequest;
import com.mylife.core.dto.request.RegisterRequest;
import com.mylife.core.dto.request.UpdateProfileRequest;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.core.dto.response.AuthResponse;
import com.mylife.core.service.AuthService;
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
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Registro e login de usuários")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Cadastrar novo usuário")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Usuário cadastrado com sucesso."));
    }

    @Operation(summary = "Realizar login e obter token JWT")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login realizado com sucesso."));
    }

    @Operation(summary = "Atualizar nome do perfil")
    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User user) {
        AuthResponse response = authService.updateProfile(request, user);
        return ResponseEntity.ok(ApiResponse.success(response, "Perfil atualizado com sucesso."));
    }

    @Operation(summary = "Alterar senha do usuário")
    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User user) {
        authService.changePassword(request, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Senha alterada com sucesso."));
    }
}
