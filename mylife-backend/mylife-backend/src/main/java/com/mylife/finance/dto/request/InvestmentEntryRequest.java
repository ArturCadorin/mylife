package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.InvestmentEntryType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvestmentEntryRequest {

    @NotNull
    private InvestmentEntryType type;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private LocalDate date;

    private String note;
}
