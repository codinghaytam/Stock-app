package com.olivepro.domain;

import com.olivepro.enums.TankStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tanks")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Tank {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private double capacity;
    private double currentLevel;
    private double acidity;
    private double waxes;
    private double avgCost;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TankStatus status = TankStatus.EMPTY;
    private String notes;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

