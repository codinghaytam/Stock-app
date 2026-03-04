package com.olivepro.dto.request;

import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import com.olivepro.enums.ProductType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class StockItemRequest {
    @NotNull private String name;
    @NotNull private ProductType productType;
    @Positive private double quantity;
    @NotNull private String unit;
    private double pricePerUnit;
    private Brand brand;
    private BottleSize bottleSize;
}

