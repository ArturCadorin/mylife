package com.mylife.fit.dto.request;

import com.mylife.fit.domain.enums.ActivityLevel;
import com.mylife.fit.domain.enums.BiologicalSex;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FitProfileRequest {

    @DecimalMin(value = "50.0", message = "Altura mínima: 50 cm")
    @DecimalMax(value = "280.0", message = "Altura máxima: 280 cm")
    private BigDecimal heightCm;

    @DecimalMin(value = "1.0", message = "Peso mínimo: 1 kg")
    @DecimalMax(value = "500.0", message = "Peso máximo: 500 kg")
    private BigDecimal weightKg;

    @DecimalMin(value = "1.0", message = "Peso alvo mínimo: 1 kg")
    @DecimalMax(value = "500.0", message = "Peso alvo máximo: 500 kg")
    private BigDecimal targetWeightKg;

    private LocalDate birthDate;

    private BiologicalSex biologicalSex;

    private ActivityLevel activityLevel;
}
