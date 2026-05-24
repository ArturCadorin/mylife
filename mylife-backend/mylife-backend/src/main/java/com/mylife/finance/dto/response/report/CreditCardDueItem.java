package com.mylife.finance.dto.response.report;

import com.mylife.finance.domain.enums.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CreditCardDueItem {

    private String cardName;
    private String bankName;
    private String color;
    private BigDecimal amount;
    private LocalDate dueDate;
    private InvoiceStatus status;
}
