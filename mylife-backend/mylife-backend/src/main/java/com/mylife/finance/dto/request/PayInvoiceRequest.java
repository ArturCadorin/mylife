package com.mylife.finance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PayInvoiceRequest {

    @NotNull(message = "Conta é obrigatória.")
    private Long accountId;

    private String note;
}
