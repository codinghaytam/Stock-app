package com.olivepro.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String invoiceNumber;
    @Column(nullable = false)
    private String clientName;
    private String clientAddress;
    private String clientIce;
    @Column(nullable = false)
    private LocalDate date;
    @Builder.Default
    private double tvaRate = 0.20;
    private double totalHT;
    private double tvaAmount;
    private double totalTTC;
    @Column(length = 500)
    private String amountInWords;
    private String paymentMode;
    private String notes;
    private String createdBy;
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

