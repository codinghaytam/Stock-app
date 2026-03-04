package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class FuelStatsResponse {
    private double currentStock;
    private double costPerLiter;
    private boolean isLowStock;
    private double threshold;
}

