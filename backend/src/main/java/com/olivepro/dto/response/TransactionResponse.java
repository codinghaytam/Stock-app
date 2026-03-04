package com.olivepro.dto.response;

import com.olivepro.enums.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TransactionResponse {
    private Long id;
    private TransactionType type;
    private ProductType productType;
    private String partnerName;
    private double quantity;
    private String unit;
    private double pricePerUnit;
    private double priceTotal;
    private Double originalAmount;
    private Currency currency;
    private double exchangeRate;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private double amountPaid;
    private Long vehicleId;
    private Long bankAccountId;
    private double acidity;
    private double waxes;
    private String notes;
    private String gpsLocation;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<TankDistributionResponse> tankDistributions;

    @Data
    public static class TankDistributionResponse {
        private Long tankId;
        private double quantity;
    }
}

