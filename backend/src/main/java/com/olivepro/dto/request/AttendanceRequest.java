package com.olivepro.dto.request;

import com.olivepro.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AttendanceRequest {
    @NotNull private Long employeeId;
    @NotNull private LocalDate date;
    @NotNull private AttendanceStatus status;
    private double overtimeHours;
    private double advanceAmount;
    private String notes;
}

