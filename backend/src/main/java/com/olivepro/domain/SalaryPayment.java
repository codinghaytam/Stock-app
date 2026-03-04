package com.olivepro.domain;

import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_payments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryPayment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    @Column(nullable = false)
    private String period;
    private double grossAmount;
    private double deductions;
    private double netAmount;
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PAYE;
    private Long bankAccountId;
    private LocalDateTime paidAt;
    private String notes;
    private String createdBy;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

