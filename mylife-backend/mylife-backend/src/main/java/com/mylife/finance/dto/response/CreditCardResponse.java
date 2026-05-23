package com.mylife.finance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditCardResponse {

    private Long id;
    private String name;
    private String bankName;
    private String color;
    private String lastFourDigits;
    private BigDecimal totalLimit;
    private BigDecimal availableLimit;
    private BigDecimal currentInvoiceTotal;
    private Integer closingDay;
    private Integer dueDay;
    private Long linkedAccountId;
    private String linkedAccountName;
    private boolean active;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
}
