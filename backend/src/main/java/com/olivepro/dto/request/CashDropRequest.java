package com.olivepro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CashDropRequest {
    @Positive private double amount;
    private String notes;
}

