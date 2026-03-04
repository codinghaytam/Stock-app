package com.olivepro.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class TankTransferRequest {
    @NotNull private Long sourceTankId;
    @NotNull private Long destTankId;
    @Positive private double quantity;
}

