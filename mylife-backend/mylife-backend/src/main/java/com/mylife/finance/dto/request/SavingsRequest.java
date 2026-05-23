package com.mylife.finance.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SavingsRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String description;

    @Positive
    private BigDecimal targetAmount;

    @Positive
    private BigDecimal cdiRate;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal currentCdiValue;

    private Long linkedAccountId;
}
