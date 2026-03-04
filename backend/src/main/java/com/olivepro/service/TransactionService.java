package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.TransactionRequest;
import com.olivepro.enums.*;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

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
}

