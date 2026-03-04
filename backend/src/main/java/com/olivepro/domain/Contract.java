package com.olivepro.domain;

import com.olivepro.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contracts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Contract {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String clientName;
    private String reference;
    private double targetQuantity;
    private double targetAcidity;
    private double targetWaxes;
    private double priceSell;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContractStatus status = ContractStatus.EN_COURS;
    @Builder.Default
    private double progressPercentage = 0;
    private String notes;
    private String createdBy;
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ContractAllocation> allocations = new ArrayList<>();
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

