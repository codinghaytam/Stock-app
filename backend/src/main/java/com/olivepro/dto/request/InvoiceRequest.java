package com.olivepro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class InvoiceRequest {
    @NotBlank private String clientName;
    private String clientAddress;
    private String clientIce;
    @NotNull private LocalDate date;
    private double tvaRate = 0.20;
    private String paymentMode;
    private String notes;
    @NotNull private List<InvoiceItemDto> items;

    @Data
    public static class InvoiceItemDto {
        private String description;
        private double quantity;
        private String unit;
        private double unitPrice;
    }
}

