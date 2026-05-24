package com.mylife.finance.dto.response;

import com.mylife.finance.domain.enums.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InvoiceResponse {

    private Long id;
    private Long creditCardId;
    private String creditCardName;
    private String yearMonth;
    private LocalDate dueDate;
    private BigDecimal totalAmount;
    private InvoiceStatus status;
    private LocalDate paidAt;
    private Long paymentTransactionId;
    private List<CreditCardTransactionResponse> transactions;
    private LocalDateTime createdAt;
}
