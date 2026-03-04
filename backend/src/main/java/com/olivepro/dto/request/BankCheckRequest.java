package com.olivepro.dto.request;

import com.olivepro.enums.CheckDirection;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BankCheckRequest {
    private String checkNumber;
    @NotNull private double amount;
    @NotNull private CheckDirection direction;
    private String partnerName;
    private String bankName;
    private LocalDate dueDate;
    private String notes;
}

