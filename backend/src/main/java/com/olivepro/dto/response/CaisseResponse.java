package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class CaisseResponse {
    private double caisseUsine;
    private double caisseDirecteur;
    private double netProfit;
    private double totalReceivables;
    private double totalPayables;
    private double totalBankBalance;
}

