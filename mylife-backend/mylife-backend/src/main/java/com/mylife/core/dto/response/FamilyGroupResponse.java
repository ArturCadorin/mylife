package com.mylife.core.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FamilyGroupResponse {

    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private List<UserSummaryResponse> members;
}
