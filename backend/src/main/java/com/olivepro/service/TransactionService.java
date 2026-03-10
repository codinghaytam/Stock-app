package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.TransactionRequest;
import com.olivepro.enums.Currency;
import com.olivepro.enums.PaymentMethod;
import com.olivepro.enums.PaymentStatus;
import com.olivepro.enums.ProductType;
import com.olivepro.enums.TransactionType;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository repo;
    private final TankService tankService;
    private final BankAccountRepository bankAccountRepo;
    private final ActivityLogService logService;

    public TransactionService(TransactionRepository repo, TankService tankService,
                               BankAccountRepository bankAccountRepo, ActivityLogService logService) {
        this.repo = repo; this.tankService = tankService;
        this.bankAccountRepo = bankAccountRepo; this.logService = logService;
    }

    public List<Transaction> getAll() { return repo.findAll(); }

    public Transaction getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));
    }

    public List<Transaction> getByVehicle(Long vehicleId) { return repo.findByVehicleId(vehicleId); }

    @Transactional
    public Transaction create(TransactionRequest req, String username) {
        Transaction tx = Transaction.builder()
                .type(req.getType()).productType(req.getProductType())
                .partnerName(req.getPartnerName()).quantity(req.getQuantity())
                .unit(req.getUnit()).pricePerUnit(req.getPricePerUnit())
                .priceTotal(req.getPriceTotal()).originalAmount(req.getOriginalAmount())
                .currency(req.getCurrency() != null ? req.getCurrency() : Currency.MAD)
                .exchangeRate(req.getExchangeRate() > 0 ? req.getExchangeRate() : 1.0)
                .paymentMethod(req.getPaymentMethod()).paymentStatus(req.getPaymentStatus())
                .amountPaid(req.getAmountPaid()).vehicleId(req.getVehicleId())
                .bankAccountId(req.getBankAccountId()).acidity(req.getAcidity())
                .waxes(req.getWaxes()).notes(req.getNotes()).gpsLocation(req.getGpsLocation())
                .createdBy(username).build();

        // Handle tank distributions for HUILE_VRAC
        if (req.getProductType() == ProductType.HUILE_VRAC && req.getTankDistributions() != null) {
            List<TankDistribution> dists = new ArrayList<>();
            for (var d : req.getTankDistributions()) {
                TankDistribution td = TankDistribution.builder()
                        .transaction(tx).tankId(d.getTankId()).quantity(d.getQuantity())
                        .acidity(d.getAcidity()).waxes(d.getWaxes()).build();
                dists.add(td);
                if (req.getType() == TransactionType.VENTE) {
                    tankService.drain(d.getTankId(), d.getQuantity());
                } else if (req.getType() == TransactionType.ACHAT || req.getType() == TransactionType.PRODUCTION) {
                    double unitCost = req.getQuantity() > 0 ? req.getPriceTotal() / req.getQuantity() : 0;
                    tankService.fill(d.getTankId(), d.getQuantity(), d.getAcidity(), d.getWaxes(), unitCost);
                }
            }
            tx.setTankDistributions(dists);
        }

        // Bank balance update for VIREMENT
        if (req.getPaymentMethod() == PaymentMethod.VIREMENT && req.getBankAccountId() != null) {
            bankAccountRepo.findById(req.getBankAccountId()).ifPresent(acc -> {
                double delta = req.getType() == TransactionType.VENTE ? req.getAmountPaid() : -req.getAmountPaid();
                acc.setBalance(acc.getBalance() + delta);
                bankAccountRepo.save(acc);
                log.info("BankAccount {} balance updated by {}", acc.getName(), delta);
            });
        }

        Transaction saved = repo.save(tx);
        logService.log(username, "Transaction", req.getType() + " " + req.getProductType() +
                " " + req.getQuantity() + " (" + req.getPartnerName() + ")", req.getPriceTotal());
        return saved;
    }

    @Transactional
    public void delete(Long id, String username) {
        repo.deleteById(id);
        logService.log(username, "Transaction", "Suppression id=" + id, null);
    }

    // Partner report aggregation
    public List<Map<String, Object>> partnerReport() {
        List<Object[]> rows = repo.aggregateByPartner();
        // rows: partnerName, type, count, sumPriceTotal, lastDate
        Map<String, Map<String, Object>> map = new java.util.HashMap<>();
        for (Object[] r : rows) {
            String partner = r[0] != null ? r[0].toString() : "";
            String type = r[1] != null ? r[1].toString() : "";
            long count = 0;
            Object cntObj = r[2];
            if (cntObj instanceof Number) count = ((Number) cntObj).longValue();
            double total = r[3] != null ? ((Number) r[3]).doubleValue() : 0.0;
            java.time.LocalDateTime last = null;
            if (r[4] != null) {
                if (r[4] instanceof java.time.LocalDateTime) last = (java.time.LocalDateTime) r[4];
                else if (r[4] instanceof java.sql.Timestamp) last = ((java.sql.Timestamp) r[4]).toLocalDateTime();
            }
            var m = map.computeIfAbsent(partner, k -> new java.util.HashMap<String,Object>());
            m.putIfAbsent("partnerName", partner);
            if (type.equals("VENTE")) {
                m.put("totalSales", ((Number)m.getOrDefault("totalSales", 0)).doubleValue() + total);
            } else if (type.equals("ACHAT")) {
                m.put("totalPurchases", ((Number)m.getOrDefault("totalPurchases", 0)).doubleValue() + total);
            }
            m.put("transactionCount", ((Number)m.getOrDefault("transactionCount", 0)).longValue() + count);
            if (last != null) m.put("lastTransactionDate", last.toString());
        }
        // compute balance
        return map.values().stream().map(m -> {
            double sales = ((Number)m.getOrDefault("totalSales", 0)).doubleValue();
            double purchases = ((Number)m.getOrDefault("totalPurchases", 0)).doubleValue();
            m.put("balance", sales - purchases);
            return m;
        }).collect(Collectors.toList());
    }

    public double partnerBalance(String partnerName) {
        return repo.partnerNetBalance(partnerName);
    }
}
