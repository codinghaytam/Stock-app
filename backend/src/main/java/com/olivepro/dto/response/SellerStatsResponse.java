package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class SellerStatsResponse {
    private double totalSales;
    private double totalCashCollected;
    private double totalCreditGiven;
    private double totalDeposited;
    private double netCashInHand;
}

