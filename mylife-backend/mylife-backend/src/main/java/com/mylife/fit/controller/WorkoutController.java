package com.mylife.fit.controller;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.response.ApiResponse;
import com.mylife.fit.domain.enums.WorkoutStatus;
import com.mylife.fit.domain.enums.WorkoutType;
import com.mylife.fit.dto.request.WorkoutExerciseRequest;
import com.mylife.fit.dto.request.WorkoutRequest;
import com.mylife.fit.dto.request.WorkoutUpdateRequest;
import com.mylife.fit.dto.response.WorkoutExerciseResponse;
import com.mylife.fit.dto.response.WorkoutResponse;
import com.mylife.fit.dto.response.WorkoutSummaryResponse;
import com.mylife.fit.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/fit/workouts")
@RequiredArgsConstructor
@Tag(name = "Fit — Treinos", description = "Registro e acompanhamento de treinos")
@SecurityRequirement(name = "bearerAuth")
public class WorkoutController {

    private final WorkoutService workoutService;

    @Operation(summary = "Registrar treino")
    @PostMapping
    public ResponseEntity<ApiResponse<WorkoutResponse>> create(
            @Valid @RequestBody WorkoutRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        workoutService.create(request, user),
                        "Treino registrado com sucesso."));
    }

    @Operation(summary = "Listar treinos — OWNER vê todos do grupo, MEMBER vê apenas os seus")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<WorkoutResponse>>> findAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) WorkoutType type,
            @RequestParam(required = false) WorkoutStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.findAll(user, type, status, from, to, pageable),
                "Treinos encontrados."));
    }

    @Operation(summary = "Buscar treino por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkoutResponse>> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.findById(id, user),
                "Treino encontrado."));
    }

    @Operation(summary = "Atualizar treino")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkoutResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutUpdateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.update(id, request, user),
                "Treino atualizado com sucesso."));
    }

    @Operation(summary = "Marcar treino como concluído")
    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<WorkoutResponse>> complete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.complete(id, user),
                "Treino concluído."));
    }

    @Operation(summary = "Marcar treino como pulado")
    @PatchMapping("/{id}/skip")
    public ResponseEntity<ApiResponse<WorkoutResponse>> skip(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.skip(id, user),
                "Treino marcado como pulado."));
    }

    @Operation(summary = "Excluir treino")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        workoutService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Treino excluído com sucesso."));
    }

    // ── Exercises sub-resource ────────────────────────────────────────────────

    @Operation(summary = "Adicionar exercício ao treino")
    @PostMapping("/{id}/exercises")
    public ResponseEntity<ApiResponse<WorkoutExerciseResponse>> addExercise(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutExerciseRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        workoutService.addExercise(id, request, user),
                        "Exercício adicionado com sucesso."));
    }

    @Operation(summary = "Atualizar exercício do treino")
    @PutMapping("/{id}/exercises/{exerciseId}")
    public ResponseEntity<ApiResponse<WorkoutExerciseResponse>> updateExercise(
            @PathVariable Long id,
            @PathVariable Long exerciseId,
            @Valid @RequestBody WorkoutExerciseRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.updateExercise(id, exerciseId, request, user),
                "Exercício atualizado com sucesso."));
    }

    @Operation(summary = "Remover exercício do treino")
    @DeleteMapping("/{id}/exercises/{exerciseId}")
    public ResponseEntity<ApiResponse<Void>> deleteExercise(
            @PathVariable Long id,
            @PathVariable Long exerciseId,
            @AuthenticationPrincipal User user) {
        workoutService.deleteExercise(id, exerciseId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Exercício removido com sucesso."));
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    @Operation(summary = "Resumo de treinos do mês atual")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<WorkoutSummaryResponse>> getSummary(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                workoutService.getSummary(user),
                "Resumo gerado com sucesso."));
    }
}
