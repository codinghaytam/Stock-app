package com.olivepro.dto.request;

import com.olivepro.enums.VehicleType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank private String plateNumber;
    @NotBlank private String driverName;
    private VehicleType type;
    private String notes;
}

