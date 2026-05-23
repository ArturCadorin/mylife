package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.TransactionCategory;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreditCardTransactionRequest {

    @NotBlank(message = "Descrição é obrigatória.")
    private String description;

    @NotNull(message = "Valor total é obrigatório.")
    @Positive(message = "Valor total deve ser positivo.")
    private BigDecimal totalAmount;

    @NotNull(message = "Número de parcelas é obrigatório.")
    @Min(value = 1, message = "Mínimo 1 parcela.")
    @Max(value = 48, message = "Máximo 48 parcelas.")
    private Integer totalInstallments;

    @NotNull(message = "Categoria é obrigatória.")
    private TransactionCategory category;

    @NotNull(message = "Data da compra é obrigatória.")
    private LocalDate purchaseDate;

    private String note;
}
