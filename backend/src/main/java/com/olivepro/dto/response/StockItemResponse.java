package com.olivepro.dto.response;

import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import com.olivepro.enums.ProductType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StockItemResponse {
    private Long id;
    private String name;
    private ProductType productType;
    private double quantity;
    private String unit;
    private double pricePerUnit;
    private Brand brand;
    private BottleSize bottleSize;
    private LocalDateTime createdAt;
}

