package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.InvestmentEntryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvestmentEntryRequest {

    @NotNull
    private InvestmentEntryType type;

    @NotNull
    @DecimalMin(value = "0.0", message = "Valor não pode ser negativo.")
    private BigDecimal amount;

    @NotNull
    private LocalDate date;

    private String note;
}
