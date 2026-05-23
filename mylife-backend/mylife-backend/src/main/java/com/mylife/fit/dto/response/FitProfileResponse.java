package com.mylife.fit.dto.response;

import com.mylife.fit.domain.enums.ActivityLevel;
import com.mylife.fit.domain.enums.BiologicalSex;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class FitProfileResponse {
    private Long id;
    private Long userId;
    private String userName;
    private BigDecimal heightCm;
    private BigDecimal weightKg;
    private BigDecimal targetWeightKg;
    private LocalDate birthDate;
    private Integer age;
    private BiologicalSex biologicalSex;
    private ActivityLevel activityLevel;
    private BigDecimal bmi;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
