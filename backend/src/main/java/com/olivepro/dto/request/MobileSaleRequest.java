package com.olivepro.dto.request;

import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class MobileSaleRequest {
    @NotBlank private String clientName;
    @NotNull private PaymentMethod paymentMethod;
    @NotNull private PaymentStatus paymentStatus;
    private double amountPaid;
    private String gpsLocation;
    @NotNull private List<SaleItem> items;

    @Data
    public static class SaleItem {
        private Brand brand;
        private BottleSize bottleSize;
        private int quantity;
        private double pricePerUnit;
    }
}

