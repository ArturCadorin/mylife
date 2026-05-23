package com.mylife.finance.dto.response.report;

import com.mylife.finance.domain.enums.TransactionCategory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CategorySummaryResponse {

    private TransactionCategory category;
    private BigDecimal totalAmount;
    private Long transactionCount;
    private BigDecimal percentageOfTotal;
}
