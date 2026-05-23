package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.FixedIncomeIndexer;
import com.mylife.finance.domain.enums.InvestmentType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class InvestmentResponse {

    private Long id;
    private String name;
    private InvestmentType type;
    private String typeLabel;
    private String institution;
    private BigDecimal totalInvested;
    private BigDecimal currentValue;
    private BigDecimal yieldAmount;
    private BigDecimal yieldPercentage;

    // Fixed income
    private FixedIncomeIndexer indexer;
    private BigDecimal indexerRate;
    private BigDecimal fixedRate;
    private BigDecimal currentIndexValue;
    private LocalDate maturityDate;
    private BigDecimal estimatedReturn;

    private Long linkedAccountId;
    private String linkedAccountName;
    private boolean active;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdatedAt;
}
