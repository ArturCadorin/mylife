package com.mylife.finance.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreditCardRequest {

    @NotBlank(message = "Nome é obrigatório.")
    private String name;

    private String bankName;

    private String color;

    @Size(min = 4, max = 4, message = "Últimos 4 dígitos devem ter exatamente 4 caracteres.")
    private String lastFourDigits;

    @NotNull(message = "Limite total é obrigatório.")
    @Positive(message = "Limite total deve ser positivo.")
    private BigDecimal totalLimit;

    @NotNull(message = "Dia de fechamento é obrigatório.")
    @Min(value = 1, message = "Dia de fechamento deve ser entre 1 e 31.")
    @Max(value = 31, message = "Dia de fechamento deve ser entre 1 e 31.")
    private Integer closingDay;

    @NotNull(message = "Dia de vencimento é obrigatório.")
    @Min(value = 1, message = "Dia de vencimento deve ser entre 1 e 31.")
    @Max(value = 31, message = "Dia de vencimento deve ser entre 1 e 31.")
    private Integer dueDay;

    private Long linkedAccountId;
}
