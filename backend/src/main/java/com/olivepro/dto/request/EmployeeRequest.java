package com.olivepro.dto.request;

import com.olivepro.enums.EmployeeRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class EmployeeRequest {
    @NotBlank private String fullName;
    @NotNull private EmployeeRole role;
    private double baseSalary;
    private String phone;
    private LocalDate hireDate;
}

