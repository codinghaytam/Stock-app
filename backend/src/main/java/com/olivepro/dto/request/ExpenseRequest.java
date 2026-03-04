package com.olivepro.dto.request;

import com.olivepro.enums.ExpenseCategory;
import com.olivepro.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    @NotBlank private String description;
    @NotNull private double amount;
    @NotNull private ExpenseCategory category;
    @NotNull private PaymentMethod paymentMethod;
    private Long bankAccountId;
    private LocalDate date;
}

