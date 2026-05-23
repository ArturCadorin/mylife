package com.mylife.fit.dto.response;

import com.mylife.fit.domain.enums.WorkoutStatus;
import com.mylife.fit.domain.enums.WorkoutType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class WorkoutResponse {
    private Long id;
    private String name;
    private WorkoutType type;
    private String typeLabel;
    private LocalDate date;
    private LocalTime startTime;
    private Integer durationMinutes;
    private WorkoutStatus status;
    private Integer caloriesBurned;
    private Integer heartRateAvg;
    private BigDecimal distanceKm;
    private String pace;
    private String note;
    private List<WorkoutExerciseResponse> exercises;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
