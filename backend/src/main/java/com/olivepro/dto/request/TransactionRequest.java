package com.olivepro.dto.request;

import com.olivepro.enums.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class TransactionRequest {
    @NotNull private TransactionType type;
    private ProductType productType;
    private String partnerName;
    private double quantity;
    private String unit;
    private double pricePerUnit;
    @NotNull private double priceTotal;
    private Double originalAmount;
    private Currency currency;
    private double exchangeRate = 1.0;
    @NotNull private PaymentMethod paymentMethod;
    @NotNull private PaymentStatus paymentStatus;
    private double amountPaid;
    private Long vehicleId;
    private Long bankAccountId;
    private double acidity;
    private double waxes;
    private String notes;
    private String gpsLocation;
    private List<TankDistributionDto> tankDistributions;

    @Data
    public static class TankDistributionDto {
        private Long tankId;
        private double quantity;
        private double acidity;
        private double waxes;
    }
}

