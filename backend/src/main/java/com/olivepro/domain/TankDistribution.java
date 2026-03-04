package com.olivepro.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tank_distributions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TankDistribution {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;
    @Column(nullable = false)
    private Long tankId;
    @Column(nullable = false)
    private double quantity;
    private double unitCost;
    private double acidity;
    private double waxes;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

