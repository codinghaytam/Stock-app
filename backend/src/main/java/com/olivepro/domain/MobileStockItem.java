package com.olivepro.domain;

import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mobile_stock_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MobileStockItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    @Enumerated(EnumType.STRING)
    private Brand brand;
    @Enumerated(EnumType.STRING)
    private BottleSize bottleSize;
    private int quantity;
    private double pricePerUnit;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

