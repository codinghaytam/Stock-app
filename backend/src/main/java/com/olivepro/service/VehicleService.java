package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.enums.Currency;
import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.PaymentStatus;
import com.olivepro.enums.ProductType;
import com.olivepro.enums.TransactionType;
import com.olivepro.enums.VehicleStatus;
import com.olivepro.exception.BusinessRuleException;
import com.olivepro.exception.InsufficientStockException;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
public class VehicleService {

    private static final Logger log = LoggerFactory.getLogger(VehicleService.class);

    private final VehicleRepository vehicleRepo;
    private final StockItemRepository stockRepo;
    private final MobileStockItemRepository mobileStockRepo;
    private final TransactionRepository txRepo;
    private final ActivityLogService logService;

    public VehicleService(VehicleRepository vehicleRepo, StockItemRepository stockRepo,
                           MobileStockItemRepository mobileStockRepo, TransactionRepository txRepo,
                           ActivityLogService logService) {
        this.vehicleRepo = vehicleRepo; this.stockRepo = stockRepo;
        this.mobileStockRepo = mobileStockRepo; this.txRepo = txRepo; this.logService = logService;
    }

    public List<Vehicle> getAll() { return vehicleRepo.findAll(); }

    public Vehicle getById(Long id) {
        return vehicleRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + id));
    }

    @Transactional
    public Vehicle create(VehicleRequest req, String username) {
        if (vehicleRepo.existsByPlateNumber(req.getPlateNumber()))
            throw new BusinessRuleException("Plaque déjà enregistrée: " + req.getPlateNumber());
        Vehicle v = Vehicle.builder().plateNumber(req.getPlateNumber().toUpperCase())
                .driverName(req.getDriverName()).type(req.getType()).notes(req.getNotes()).build();
        logService.log(username, "Véhicule", "Création: " + req.getPlateNumber(), null);
        return vehicleRepo.save(v);
    }

    @Transactional
    public Vehicle update(Long id, VehicleRequest req, String username) {
        Vehicle v = getById(id);
        v.setDriverName(req.getDriverName()); v.setType(req.getType()); v.setNotes(req.getNotes());
        logService.log(username, "Véhicule", "Mise à jour: " + v.getPlateNumber(), null);
        return vehicleRepo.save(v);
    }

    @Transactional
    public void delete(Long id, String username) {
        Vehicle v = getById(id);
        vehicleRepo.delete(v);
        logService.log(username, "Véhicule", "Suppression: " + v.getPlateNumber(), null);
    }

    @Transactional
    public Vehicle loadVehicle(LoadVehicleRequest req, String username) {
        Vehicle vehicle = getById(req.getVehicleId());
        for (var item : req.getItems()) {
            StockItem stock = stockRepo.findById(item.getStockItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("StockItem not found: " + item.getStockItemId()));
            if (stock.getQuantity() < item.getQuantity())
                throw new InsufficientStockException("Stock insuffisant: " + stock.getName());
            stock.setQuantity(stock.getQuantity() - item.getQuantity());
            stockRepo.save(stock);
            // Merge into mobile stock
            var mobileOpt = mobileStockRepo.findByVehicleIdAndBrandAndBottleSize(
                    req.getVehicleId(), stock.getBrand(), stock.getBottleSize());
            if (mobileOpt.isPresent()) {
                MobileStockItem m = mobileOpt.get();
                m.setQuantity(m.getQuantity() + item.getQuantity());
                m.setPricePerUnit(item.getPricePerUnit());
                mobileStockRepo.save(m);
            } else {
                mobileStockRepo.save(MobileStockItem.builder()
                        .vehicle(vehicle).brand(stock.getBrand()).bottleSize(stock.getBottleSize())
                        .quantity(item.getQuantity()).pricePerUnit(item.getPricePerUnit()).build());
            }
        }
        logService.log(username, "Chargement", "Véhicule " + vehicle.getPlateNumber() +
                " (" + req.getItems().size() + " articles)", null);
        return vehicleRepo.findById(req.getVehicleId()).orElseThrow();
    }

    public List<MobileStockItem> getMobileStock(Long vehicleId) {
        return mobileStockRepo.findByVehicleId(vehicleId);
    }

    @Transactional
    public List<Transaction> mobileSale(Long vehicleId, MobileSaleRequest req, String username) {
        Vehicle vehicle = getById(vehicleId);
        List<Transaction> created = new ArrayList<>();
        double totalCartValue = req.getItems().stream()
                .mapToDouble(i -> i.getQuantity() * i.getPricePerUnit()).sum();
        for (var item : req.getItems()) {
            var mobileOpt = mobileStockRepo.findByVehicleIdAndBrandAndBottleSize(
                    vehicleId, item.getBrand(), item.getBottleSize());
            if (mobileOpt.isEmpty() || mobileOpt.get().getQuantity() < item.getQuantity())
                throw new InsufficientStockException("Stock mobile insuffisant: " + item.getBrand() + " " + item.getBottleSize());
            MobileStockItem m = mobileOpt.get();
            m.setQuantity(m.getQuantity() - item.getQuantity());
            mobileStockRepo.save(m);
            double itemTotal = item.getQuantity() * item.getPricePerUnit();
            double itemPaid = req.getPaymentStatus() == PaymentStatus.PAYE ? itemTotal
                    : req.getPaymentStatus() == PaymentStatus.IMPAYE ? 0
                    : (totalCartValue > 0 ? req.getAmountPaid() * itemTotal / totalCartValue : 0);
            Transaction tx = Transaction.builder()
                    .type(TransactionType.VENTE).productType(ProductType.HUILE_BOUTEILLE)
                    .partnerName(req.getClientName()).quantity(item.getQuantity()).unit("unités")
                    .pricePerUnit(item.getPricePerUnit()).priceTotal(itemTotal)
                    .currency(Currency.MAD).exchangeRate(1.0)
                    .paymentMethod(req.getPaymentMethod()).paymentStatus(req.getPaymentStatus())
                    .amountPaid(itemPaid).vehicleId(vehicleId)
                    .gpsLocation(req.getGpsLocation()).createdBy(username)
                    .tankDistributions(new ArrayList<>()).build();
            created.add(txRepo.save(tx));
        }
        logService.log(username, "Vente Mobile", "Camion " + vehicle.getPlateNumber() +
                " -> " + req.getClientName(), totalCartValue);
        return created;
    }

    public com.olivepro.dto.response.SellerStatsResponse getSellerStats(Long vehicleId) {
        List<Transaction> txs = txRepo.findByVehicleId(vehicleId);
        double totalSales = txs.stream().mapToDouble(Transaction::getPriceTotal).sum();
        double totalCash = txs.stream().filter(t -> t.getPaymentMethod() == PaymentMethod.ESPECE)
                .mapToDouble(Transaction::getAmountPaid).sum();
        double totalCredit = txs.stream().filter(t -> t.getPaymentStatus() == PaymentStatus.IMPAYE || t.getPaymentStatus() == PaymentStatus.PARTIEL)
                .mapToDouble(t -> t.getPriceTotal() - t.getAmountPaid()).sum();
        double totalDeposited = txRepo.findByTypeAndPaymentMethod(TransactionType.VERSEMENT, PaymentMethod.ESPECE)
                .stream().filter(t -> vehicleId.equals(t.getVehicleId())).mapToDouble(Transaction::getAmountPaid).sum();
        return new com.olivepro.dto.response.SellerStatsResponse(totalSales, totalCash, totalCredit, totalDeposited, totalCash - totalDeposited);
    }
}

