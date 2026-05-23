package com.mylife.fit.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BodyMeasurementRequest {

    @NotNull(message = "Data é obrigatória.")
    private LocalDate date;

    @DecimalMin(value = "1.0") @DecimalMax(value = "500.0")
    private BigDecimal weightKg;

    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0")
    private BigDecimal bodyFatPercentage;

    @DecimalMin(value = "0.0") @DecimalMax(value = "200.0")
    private BigDecimal muscleMassKg;

    @DecimalMin(value = "0.0") @DecimalMax(value = "300.0")
    private BigDecimal waistCm;

    @DecimalMin(value = "0.0") @DecimalMax(value = "300.0")
    private BigDecimal chestCm;

    @DecimalMin(value = "0.0") @DecimalMax(value = "300.0")
    private BigDecimal hipsCm;

    @DecimalMin(value = "0.0") @DecimalMax(value = "200.0")
    private BigDecimal leftArmCm;

    @DecimalMin(value = "0.0") @DecimalMax(value = "200.0")
    private BigDecimal rightArmCm;

    @DecimalMin(value = "0.0") @DecimalMax(value = "200.0")
    private BigDecimal leftThighCm;

    @DecimalMin(value = "0.0") @DecimalMax(value = "200.0")
    private BigDecimal rightThighCm;

    private String note;
}
