package com.olivepro.domain;

import com.olivepro.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transactions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private TransactionType type;
    @Enumerated(EnumType.STRING)
    private ProductType productType;
    private String partnerName;
    private double quantity;
    private String unit;
    private double pricePerUnit;
    @Column(nullable = false)
    private double priceTotal;
    private Double originalAmount;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Currency currency = Currency.MAD;
    @Builder.Default
    private double exchangeRate = 1.0;
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;
    private double amountPaid;
    private Long vehicleId;
    private Long bankAccountId;
    private double acidity;
    private double waxes;
    private String notes;
    private String gpsLocation;
    private String createdBy;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TankDistribution> tankDistributions = new ArrayList<>();
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

