package com.olivepro.domain;

import com.olivepro.enums.Currency;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_accounts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BankAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    private String bankName;
    private String accountNumber;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Currency currency = Currency.MAD;
    private double balance;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

