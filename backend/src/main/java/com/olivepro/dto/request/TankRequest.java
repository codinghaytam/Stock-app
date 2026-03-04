package com.olivepro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class TankRequest {
    @NotBlank private String name;
    @Positive private double capacity;
    private String notes;
}

