package com.olivepro.domain;

import com.olivepro.enums.FuelLogType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fuel_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FuelLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private FuelLogType type;
    @Column(nullable = false)
    private double quantity;
    private Double cost;
    private String vehiclePlate;
    private Long vehicleId;
    private String notes;
    private String createdBy;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

