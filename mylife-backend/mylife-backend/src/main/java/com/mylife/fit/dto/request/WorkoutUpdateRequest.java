package com.mylife.fit.dto.request;

import com.mylife.fit.domain.enums.WorkoutStatus;
import com.mylife.fit.domain.enums.WorkoutType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class WorkoutUpdateRequest {

    @NotBlank(message = "Nome é obrigatório.")
    private String name;

    @NotNull(message = "Tipo é obrigatório.")
    private WorkoutType type;

    @NotNull(message = "Data é obrigatória.")
    private LocalDate date;

    private LocalTime startTime;
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private Integer heartRateAvg;
    private BigDecimal distanceKm;
    private String pace;
    private String note;

    @NotNull(message = "Status é obrigatório.")
    private WorkoutStatus status;
}
