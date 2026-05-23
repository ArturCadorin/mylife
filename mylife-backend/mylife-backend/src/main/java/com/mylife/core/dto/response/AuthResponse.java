package com.mylife.core.dto.response;

import com.mylife.core.domain.enums.ProductType;
import com.mylife.core.domain.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private Set<ProductType> products;
}
