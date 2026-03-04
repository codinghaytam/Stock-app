package com.olivepro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ContractRequest {
    @NotBlank private String clientName;
    private String reference;
    @Positive private double targetQuantity;
    private double targetAcidity;
    private double targetWaxes;
    @Positive private double priceSell;
    private String notes;
}

