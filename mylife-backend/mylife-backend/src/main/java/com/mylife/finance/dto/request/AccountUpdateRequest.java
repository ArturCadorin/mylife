package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountUpdateRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 100)
    private String bankName;

    @NotNull
    private AccountType type;

    @Size(max = 3)
    private String currency;
}
