package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class SalaryCalculationResponse {
    private Long employeeId;
    private String employeeName;
    private String period;
    private double grossAmount;
    private double deductions;
    private double netAmount;
    private int daysPresent;
    private double overtimeHours;
}

