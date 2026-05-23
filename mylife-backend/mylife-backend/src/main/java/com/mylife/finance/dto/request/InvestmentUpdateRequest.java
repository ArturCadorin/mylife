package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.FixedIncomeIndexer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvestmentUpdateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String institution;

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
