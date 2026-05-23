package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.SavingsEntryType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SavingsEntryRequest {

    @NotNull
    private SavingsEntryType type;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private LocalDate date;

    private String note;
}
