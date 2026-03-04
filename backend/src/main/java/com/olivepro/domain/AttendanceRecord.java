package com.olivepro.domain;

import com.olivepro.enums.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    @Column(nullable = false)
    private LocalDate date;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private AttendanceStatus status;
    @Builder.Default
    private double overtimeHours = 0;
    @Builder.Default
    private double advanceAmount = 0;
    private String notes;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

