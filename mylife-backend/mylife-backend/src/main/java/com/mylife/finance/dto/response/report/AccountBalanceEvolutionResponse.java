package com.mylife.finance.dto.response.report;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AccountBalanceEvolutionResponse {

    private Long accountId;
    private String accountName;
    private List<BalanceEntryResponse> entries;
}
