package com.mylife.fit.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BodyMeasurementResponse {
    private Long id;
    private Long userId;
    private LocalDate date;
    private BigDecimal weightKg;
    private BigDecimal bodyFatPercentage;
    private BigDecimal muscleMassKg;
    private BigDecimal waistCm;
    private BigDecimal chestCm;
    private BigDecimal hipsCm;
    private BigDecimal leftArmCm;
    private BigDecimal rightArmCm;
    private BigDecimal leftThighCm;
    private BigDecimal rightThighCm;
    private String note;
    private LocalDateTime createdAt;
}
