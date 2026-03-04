package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class ContractStatsResponse {
    private double totalAllocated;
    private double progressPercentage;
    private double avgAcidity;
    private double avgWaxes;
    private double totalCost;
    private double totalRevenue;
    private double profit;
    private double profitMargin;
}

