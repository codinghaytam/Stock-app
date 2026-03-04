package com.olivepro.domain;

import com.olivepro.enums.CheckDirection;
import com.olivepro.enums.CheckStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_checks")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BankCheck {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String checkNumber;
    private double amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private CheckDirection direction;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CheckStatus status = CheckStatus.EN_COFFRE;
    private String partnerName;
    private String bankName;
    private LocalDate dueDate;
    private LocalDate depositDate;
    private LocalDate encashDate;
    private String notes;
    private String createdBy;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

