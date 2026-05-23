package com.mylife.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FamilyGroupRequest {

    @NotBlank
    @Size(max = 100)
    private String name;
}
