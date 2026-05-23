package com.mylife.core.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "mylife.security.jwt")
public class JwtProperties {

    @NotBlank
    private String secret;

    @Positive
    private long expirationMs;
}
