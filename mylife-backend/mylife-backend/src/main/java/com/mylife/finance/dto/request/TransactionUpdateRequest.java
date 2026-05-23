package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionUpdateRequest {

    @NotNull(message = "Tipo é obrigatório.")
    private TransactionType type;

    @NotNull(message = "Categoria é obrigatória.")
    private TransactionCategory category;

    @NotNull(message = "Valor é obrigatório.")
    @Positive(message = "Valor deve ser positivo.")
    private BigDecimal amount;

    @NotNull(message = "Data é obrigatória.")
    private LocalDate date;

    private String description;

    private String note;

    @NotNull(message = "Conta é obrigatória.")
    private Long accountId;
}
