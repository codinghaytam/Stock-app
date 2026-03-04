package com.olivepro.dto.request;

import com.olivepro.enums.Currency;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BankAccountRequest {
    @NotBlank private String name;
    private String bankName;
    private String accountNumber;
    private Currency currency;
    private double balance;
}

