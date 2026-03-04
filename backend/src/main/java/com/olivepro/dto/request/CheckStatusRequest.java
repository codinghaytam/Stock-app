package com.olivepro.dto.request;

import com.olivepro.enums.CheckStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckStatusRequest {
    @NotNull private CheckStatus status;
}

