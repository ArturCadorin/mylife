package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.WishListCategory;
import com.mylife.finance.domain.enums.WishListPriority;
import com.mylife.finance.domain.enums.WishListStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class WishListItemResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal estimatedPrice;
    private WishListCategory category;
    private WishListPriority priority;
    private String estimatedMonth;
    private WishListStatus status;
    private LocalDate purchasedAt;
    private Long linkedAccountId;
    private String linkedAccountName;
    private Long linkedTransactionId;
    private Long ownerId;
    private String ownerName;
    private long daysUntilEstimatedMonth;
    private LocalDateTime createdAt;
}
