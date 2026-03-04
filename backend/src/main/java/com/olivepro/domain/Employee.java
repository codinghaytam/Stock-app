package com.olivepro.domain;

import com.olivepro.enums.EmployeeRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String fullName;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private EmployeeRole role;
    private double baseSalary;
    private String phone;
    private LocalDate hireDate;
    @Builder.Default
    private boolean isActive = true;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

