package com.olivepro.dto.request;

import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class LoadVehicleRequest {
    @NotNull private Long vehicleId;
    @NotNull private List<LoadItem> items;

    @Data
    public static class LoadItem {
        private Long stockItemId;
        private int quantity;
        private double pricePerUnit;
    }
}

