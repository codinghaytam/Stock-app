package com.olivepro.service;

import com.olivepro.dto.response.DashboardResponse;
import com.olivepro.repository.TankRepository;
import com.olivepro.repository.TransactionRepository;
import com.olivepro.websocket.AlertsBroadcaster;
import com.olivepro.websocket.AlertsPayload;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final TransactionRepository txRepo;
    private final TankRepository tankRepo;
    private final AccountingService accountingService;
    private final AlertsBroadcaster broadcaster;

    public DashboardService(TransactionRepository txRepo, TankRepository tankRepo,
                             AccountingService accountingService, AlertsBroadcaster broadcaster) {
        this.txRepo = txRepo; this.tankRepo = tankRepo;
        this.accountingService = accountingService; this.broadcaster = broadcaster;
    }

    public DashboardResponse getSummary() {
        double totalSales = txRepo.sumTotalSales();
        double netProfit = accountingService.getNetProfit();
        double totalVolume = tankRepo.findAll().stream().mapToDouble(t -> t.getCurrentLevel()).sum();
        double totalCapacity = tankRepo.findAll().stream().mapToDouble(t -> t.getCapacity()).sum();
        double utilization = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 0;
        long txCount = txRepo.count();

        // Weekly sales — last 7 days
        List<DashboardResponse.WeeklySalesEntry> weekly = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 6; i >= 0; i--) {
            LocalDateTime from = LocalDateTime.now().minusDays(i).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime to = from.plusDays(1);
            double dayTotal = txRepo.findByCreatedAtBetween(from, to).stream()
                    .filter(t -> t.getType().name().equals("VENTE"))
                    .mapToDouble(t -> t.getPriceTotal()).sum();
            weekly.add(new DashboardResponse.WeeklySalesEntry(
                    from.format(fmt), dayTotal, from.format(fmt)));
        }

        AlertsPayload payload = broadcaster.computePayload();
        DashboardResponse.AlertsPayloadResponse alerts = new DashboardResponse.AlertsPayloadResponse(
                payload.getUnreadEmails(), payload.getUrgentChecks(),
                payload.getLowFuel(), payload.getLowTankCount());

        return new DashboardResponse(totalSales, netProfit, totalVolume, totalCapacity,
                utilization, txCount, weekly, alerts);
    }
}

