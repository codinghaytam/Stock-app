package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private String clientName;
    private String clientAddress;
    private String clientIce;
    private LocalDate date;
    private double tvaRate;
    private double totalHT;
    private double tvaAmount;
    private double totalTTC;
    private String amountInWords;
    private String paymentMode;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<ItemDto> items;

    @Data
    public static class ItemDto {
        private Long id;
        private String description;
        private double quantity;
        private String unit;
        private double unitPrice;
        private double totalPrice;
    }
}

