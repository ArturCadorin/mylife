package com.mylife.fit.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WorkoutExerciseRequest {

    @NotBlank(message = "Nome do exercício é obrigatório.")
    private String name;

    @PositiveOrZero
    private Integer sets;

    @PositiveOrZero
    private Integer reps;

    @PositiveOrZero
    private BigDecimal weightKg;

    @PositiveOrZero
    private Integer durationSeconds;

    @PositiveOrZero
    private Integer restSeconds;

    private Integer exerciseOrder;

    private String note;
}
