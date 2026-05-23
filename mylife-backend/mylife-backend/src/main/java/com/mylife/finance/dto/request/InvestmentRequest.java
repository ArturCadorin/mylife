package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.FixedIncomeIndexer;
import com.mylife.finance.domain.enums.InvestmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvestmentRequest {

    @NotBlank
    private String name;

    @NotNull
    private InvestmentType type;

    @NotBlank
    private String institution;

    @NotNull
    @Positive
    private BigDecimal initialAmount;

    private FixedIncomeIndexer indexer;

    @Positive
    private BigDecimal indexerRate;

    @Positive
    private BigDecimal fixedRate;

    @Positive
    private BigDecimal currentIndexValue;

    private LocalDate maturityDate;

    private Long linkedAccountId;
}
