package com.mylife.finance.dto.request;

import lombok.Data;

@Data
public class PurchaseRequest {

    private Long linkedAccountId;
    private String note;
}
