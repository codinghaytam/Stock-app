package com.olivepro.dto.request;

import com.olivepro.enums.FuelLogType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class FuelLogRequest {
    @NotNull private FuelLogType type;
    @Positive private double quantity;
    private Double cost;
    private Long vehicleId;
    private String notes;
}

