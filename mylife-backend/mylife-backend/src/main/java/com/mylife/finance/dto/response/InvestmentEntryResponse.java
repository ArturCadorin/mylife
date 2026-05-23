package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.InvestmentEntryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class InvestmentEntryResponse {

    private Long id;
    private Long investmentId;
    private String investmentName;
    private InvestmentEntryType type;
    private BigDecimal amount;
    private LocalDate date;
    private String note;
    private BigDecimal previousValue;
    private BigDecimal newValue;
    private LocalDateTime createdAt;
}
