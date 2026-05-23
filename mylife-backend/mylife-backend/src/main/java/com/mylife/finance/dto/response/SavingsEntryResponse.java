package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.SavingsEntryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SavingsEntryResponse {

    private Long id;
    private Long savingsId;
    private String savingsName;
    private SavingsEntryType type;
    private BigDecimal amount;
    private LocalDate date;
    private String note;
    private LocalDateTime createdAt;
}
