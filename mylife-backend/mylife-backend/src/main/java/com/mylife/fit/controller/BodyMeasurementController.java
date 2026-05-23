package com.mylife.fit.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.fit.dto.request.BodyMeasurementRequest;
import com.mylife.fit.dto.response.BodyMeasurementResponse;
import com.mylife.fit.service.BodyMeasurementService;
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
@RequestMapping("/api/v1/fit/measurements")
@RequiredArgsConstructor
@Tag(name = "Fit — Medidas", description = "Histórico de medidas corporais")
@SecurityRequirement(name = "bearerAuth")
public class BodyMeasurementController {

    private final BodyMeasurementService measurementService;

    @Operation(summary = "Registrar medidas corporais")
    @PostMapping
    public ResponseEntity<ApiResponse<BodyMeasurementResponse>> create(
            @Valid @RequestBody BodyMeasurementRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        measurementService.create(request, user),
                        "Medidas registradas com sucesso."));
    }

    @Operation(summary = "Listar histórico de medidas")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BodyMeasurementResponse>>> findAll(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                measurementService.findAll(user, pageable),
                "Medidas encontradas."));
    }

    @Operation(summary = "Buscar medida por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BodyMeasurementResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                measurementService.findById(id, user),
                "Medida encontrada."));
    }

    @Operation(summary = "Excluir registro de medidas")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        measurementService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Medida excluída com sucesso."));
    }
}
