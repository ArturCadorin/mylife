package com.mylife.core.dto.request;

import com.mylife.core.domain.enums.ProductType;
import com.mylife.core.domain.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Set;

@Data
public class RegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String password;

    @NotNull
    private Role role;

    @NotEmpty
    private Set<ProductType> products;
}
