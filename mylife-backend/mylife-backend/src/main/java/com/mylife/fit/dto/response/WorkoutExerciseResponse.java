package com.mylife.fit.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class WorkoutExerciseResponse {
    private Long id;
    private String name;
    private Integer sets;
    private Integer reps;
    private BigDecimal weightKg;
    private Integer durationSeconds;
    private Integer restSeconds;
    private Integer exerciseOrder;
    private String note;
}
