package com.olivepro.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ContractAllocationRequest {
    @NotNull private Long contractId;
    @NotNull private Long tankId;
    @Positive private double quantity;
}

