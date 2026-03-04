package com.olivepro.domain;

import com.olivepro.enums.ExpenseCategory;
import com.olivepro.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String description;
    @Column(nullable = false)
    private double amount;
    @Enumerated(EnumType.STRING)
    private ExpenseCategory category;
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;
    private Long bankAccountId;
    @Column(nullable = false)
    private LocalDate date;
    private String createdBy;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

