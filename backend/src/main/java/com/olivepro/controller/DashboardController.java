package com.olivepro.controller;

import com.olivepro.dto.response.DashboardResponse;
import com.olivepro.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }

    @GetMapping("/summary")
    public ResponseEntity<DashboardResponse> summary() { return ResponseEntity.ok(service.getSummary()); }

    @GetMapping("/stats")
    public ResponseEntity<Object> stats() {
        DashboardResponse resp = service.getSummary();
        // return KPIs only
        var kpi = new java.util.HashMap<String, Object>();
        kpi.put("totalSales", resp.getTotalSales());
        kpi.put("netProfit", resp.getNetProfit());
        kpi.put("totalOilVolume", resp.getTotalOilVolume());
        kpi.put("totalOilCapacity", resp.getTotalOilCapacity());
        kpi.put("capacityUtilizationPercent", resp.getCapacityUtilizationPercent());
        kpi.put("totalTransactionCount", resp.getTotalTransactionCount());
        return ResponseEntity.ok(kpi);
    }

    @GetMapping("/chart/weekly-sales")
    public ResponseEntity<List<DashboardResponse.WeeklySalesEntry>> weeklyChart() {
        DashboardResponse resp = service.getSummary();
        List<DashboardResponse.WeeklySalesEntry> weekly = resp.getWeeklySales().stream().map(e -> {
            // attempt to parse date and create French short day label
            try {
                java.time.LocalDate d = java.time.LocalDate.parse(e.getDate());
                DayOfWeek dow = d.getDayOfWeek();
                String label = dow.getDisplayName(TextStyle.SHORT, Locale.FRENCH);
                return new DashboardResponse.WeeklySalesEntry(label, e.getValue(), e.getDate());
            } catch (Exception ex) {
                return e;
            }
        }).collect(Collectors.toList());
        return ResponseEntity.ok(weekly);
    }

    @GetMapping("/alerts")
    public ResponseEntity<Object> alerts() {
        DashboardResponse resp = service.getSummary();
        var a = resp.getAlerts();
        var map = new java.util.HashMap<String, Object>();
        map.put("unreadEmails", a.getUnreadEmails());
        map.put("urgentChecks", a.getUrgentChecks());
        map.put("lowFuel", a.getLowFuel());
        map.put("lowTankCount", a.getLowTankCount());
        return ResponseEntity.ok(map);
    }
}
