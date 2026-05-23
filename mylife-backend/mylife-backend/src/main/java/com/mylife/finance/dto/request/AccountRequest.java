package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 100)
    private String bankName;

    @NotNull
    private AccountType type;

    @Size(max = 3)
    private String currency = "BRL";

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal initialBalance;
}
