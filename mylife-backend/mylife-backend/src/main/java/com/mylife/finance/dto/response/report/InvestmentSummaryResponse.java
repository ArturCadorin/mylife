package com.mylife.finance.dto.response.report;

import com.mylife.finance.domain.enums.InvestmentType;
import com.mylife.finance.dto.response.InvestmentResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class InvestmentSummaryResponse {

    private BigDecimal totalInvested;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalYield;
    private BigDecimal totalYieldPercentage;
    private Map<InvestmentType, BigDecimal> byType;
    private List<InvestmentResponse> investments;
}
