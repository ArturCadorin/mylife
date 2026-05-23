package com.mylife.finance.dto.request;

import com.mylife.finance.domain.enums.WishListCategory;
import com.mylife.finance.domain.enums.WishListPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WishListItemRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String description;

    @NotNull
    @Positive
    private BigDecimal estimatedPrice;

    @NotNull
    private WishListCategory category;

    @NotNull
    private WishListPriority priority;

    @NotBlank
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Use o formato yyyy-MM (ex: 2025-06)")
    private String estimatedMonth;

    private Long linkedAccountId;
}
