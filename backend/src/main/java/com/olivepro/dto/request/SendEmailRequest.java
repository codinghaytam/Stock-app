package com.olivepro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendEmailRequest {
    @NotNull private Long fromAccountId;
    @NotBlank private String toAddress;
    @NotBlank private String subject;
    private String body;
}

