package com.mylife.finance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class SavingsResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private BigDecimal cdiRate;
    private BigDecimal currentCdiValue;
    private BigDecimal estimatedReturn;
    private Long linkedAccountId;
    private String linkedAccountName;
    private Long ownerId;
    private String ownerName;
    private BigDecimal percentualDaMeta;
    private LocalDateTime createdAt;
}
