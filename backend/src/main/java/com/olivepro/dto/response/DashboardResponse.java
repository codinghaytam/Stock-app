package com.olivepro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data @AllArgsConstructor
public class DashboardResponse {
    private double totalSales;
    private double netProfit;
    private double totalOilVolume;
    private double totalOilCapacity;
    private double capacityUtilizationPercent;
    private long totalTransactionCount;
    private List<WeeklySalesEntry> weeklySales;
    private AlertsPayloadResponse alerts;

    @Data @AllArgsConstructor
    public static class WeeklySalesEntry {
        private String label;
        private double value;
        private String date;
    }

    @Data @AllArgsConstructor
    public static class AlertsPayloadResponse {
        private int unreadEmails;
        private int urgentChecks;
        private int lowFuel;
        private int lowTankCount;
    }
}

