package com.olivepro.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ProductionRequest {
    @NotNull private Long inputStockItemId;
    @Positive private double inputQuantity;
    @NotNull private Long outputTankId;
    @Positive private double outputOilQty;
    private double acidity;
    private double waxes;
    private double unitCost;
    private double grignonsQty;
    private double fitourQty;
    private String notes;
}

