package com.olivepro.dto.response;

import com.olivepro.enums.TankStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TankResponse {
    private Long id;
    private String name;
    private double capacity;
    private double currentLevel;
    private double acidity;
    private double waxes;
    private double avgCost;
    private TankStatus status;
    private String notes;
    private double usagePercentage;
    private double stockValue;
    private double availableCapacity;
    private LocalDateTime createdAt;
}

