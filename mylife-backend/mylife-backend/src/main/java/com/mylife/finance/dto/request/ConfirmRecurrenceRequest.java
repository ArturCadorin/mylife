package com.mylife.finance.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ConfirmRecurrenceRequest {

    private Long accountId;

    @Positive(message = "Valor deve ser positivo.")
    private BigDecimal amount;

    private LocalDate date;

    private String note;
}
