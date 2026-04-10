package com.olivepro.service;

import com.olivepro.domain.FuelLog;
import com.olivepro.domain.Vehicle;
import com.olivepro.dto.request.ExpenseRequest;
import com.olivepro.dto.request.FuelLogRequest;
import com.olivepro.dto.response.FuelStatsResponse;
import com.olivepro.enums.ExpenseCategory;
import com.olivepro.enums.FuelLogType;
import com.olivepro.enums.PaymentMethod;
import com.olivepro.exception.InsufficientStockException;
import com.olivepro.repository.FuelLogRepository;
import com.olivepro.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class FuelService {


    @Value("${app.fuel.low-stock-threshold:500}")
    private double threshold;

    private final FuelLogRepository repo;
    private final VehicleRepository vehicleRepo;
    private final AccountingService accountingService;
    private final ActivityLogService logService;

    public FuelService(FuelLogRepository repo, VehicleRepository vehicleRepo,
                       AccountingService accountingService, ActivityLogService logService) {
        this.repo = repo; this.vehicleRepo = vehicleRepo;
        this.accountingService = accountingService; this.logService = logService;
    }

    public List<FuelLog> getAll() { return repo.findAllByOrderByCreatedAtDesc(); }

    public double getCurrentStock() { return repo.sumPurchased() - repo.sumConsumed(); }

    public FuelStatsResponse getStats() {
        double stock = getCurrentStock();
        double totalCost = repo.findByType(FuelLogType.ACHAT).stream()
                .mapToDouble(f -> f.getCost() != null ? f.getCost() : 0).sum();
        double totalPurchased = repo.sumPurchased();
        double costPerLiter = totalPurchased > 0 ? totalCost / totalPurchased : 0;
        return new FuelStatsResponse(stock, costPerLiter, stock < threshold, threshold);
    }

    @Transactional
    public FuelLog addLog(FuelLogRequest req, String username) {
        double currentStock = getCurrentStock();
        if (req.getType() == FuelLogType.CONSOMMATION && currentStock < req.getQuantity())
            throw new InsufficientStockException("Stock carburant insuffisant. Disponible: " + currentStock + "L");

        String plate = null;
        if (req.getType() == FuelLogType.CONSOMMATION && req.getVehicleId() != null) {
            plate = vehicleRepo.findById(req.getVehicleId()).map(Vehicle::getPlateNumber).orElse(null);
        }

        FuelLog entry = FuelLog.builder()
                .type(req.getType()).quantity(req.getQuantity()).cost(req.getCost())
                .vehicleId(req.getVehicleId()).vehiclePlate(plate)
                .notes(req.getNotes()).createdBy(username).build();
        FuelLog saved = repo.save(entry);

        if (req.getType() == FuelLogType.ACHAT && req.getCost() != null) {
            final String vehiclePlate = plate;
            accountingService.createExpense(new ExpenseRequest() {{
                setDescription("Achat Gasoil " + req.getQuantity() + "L" + (vehiclePlate != null ? " (" + vehiclePlate + ")" : ""));
                setAmount(req.getCost()); setCategory(ExpenseCategory.CARBURANT);
                setPaymentMethod(PaymentMethod.ESPECE); setDate(LocalDate.now());
            }}, username);
        }

        logService.log(username, "Carburant", req.getType() + " " + req.getQuantity() + "L" +
                (plate != null ? " (" + plate + ")" : ""), req.getCost());
        return saved;
    }

    @Transactional
    public void deleteLog(Long id, String username) {
        repo.deleteById(id);
        logService.log(username, "Carburant", "Suppression log id=" + id, null);
    }
}
