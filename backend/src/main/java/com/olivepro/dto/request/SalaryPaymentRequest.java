package com.olivepro.dto.request;

import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class SalaryPaymentRequest {
    @NotNull private Long employeeId;
    @NotNull private String period;
    @Positive private double netAmount;
    private double deductions;
    @NotNull private PaymentMethod paymentMethod;
    @NotNull private PaymentStatus paymentStatus;
    private Long bankAccountId;
    private String notes;
}

