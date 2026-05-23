package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.AccountType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AccountResponse {

    private Long id;
    private String name;
    private String bankName;
    private AccountType type;
    private BigDecimal balance;
    private String currency;
    private Long ownerId;
    private String ownerName;
    private boolean active;
    private LocalDateTime createdAt;
}
