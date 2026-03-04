package com.olivepro.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_allocations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ContractAllocation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;
    @Column(nullable = false)
    private Long tankId;
    private double quantity;
    private double acidityAtAllocation;
    private double waxesAtAllocation;
    private double costPrice;
    private String createdBy;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

