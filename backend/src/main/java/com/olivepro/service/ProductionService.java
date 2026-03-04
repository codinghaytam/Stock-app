package com.olivepro.service;

import com.olivepro.domain.Transaction;
import com.olivepro.dto.request.ProductionRequest;
import com.olivepro.enums.*;
import com.olivepro.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;

@Service
public class ProductionService {

    private static final Logger log = LoggerFactory.getLogger(ProductionService.class);

    private final StockService stockService;
    private final TankService tankService;
    private final TransactionRepository txRepo;
    private final ActivityLogService logService;

    public ProductionService(StockService stockService, TankService tankService,
                              TransactionRepository txRepo, ActivityLogService logService) {
        this.stockService = stockService; this.tankService = tankService;
        this.txRepo = txRepo; this.logService = logService;
    }

    @Transactional
    public Transaction produce(ProductionRequest req, String username) {
        // 1. Decrease input stock
        stockService.decreaseStock(req.getInputStockItemId(), req.getInputQuantity(), username);
        // 2. Fill output tank
        tankService.fill(req.getOutputTankId(), req.getOutputOilQty(),
                req.getAcidity(), req.getWaxes(), req.getUnitCost());
        // 3. Add by-products to stock
        if (req.getGrignonsQty() > 0) stockService.mergeOrCreateByType(ProductType.GRIGNONS, req.getGrignonsQty());
        if (req.getFitourQty() > 0) stockService.mergeOrCreateByType(ProductType.FITOUR, req.getFitourQty());
        // 4. Create production transaction record
        Transaction tx = Transaction.builder()
                .type(TransactionType.PRODUCTION).productType(ProductType.HUILE_VRAC)
                .quantity(req.getOutputOilQty()).unit("L")
                .priceTotal(req.getOutputOilQty() * req.getUnitCost())
                .pricePerUnit(req.getUnitCost())
                .currency(Currency.MAD).exchangeRate(1.0)
                .paymentMethod(PaymentMethod.ESPECE).paymentStatus(PaymentStatus.PAYE)
                .acidity(req.getAcidity()).waxes(req.getWaxes())
                .notes(req.getNotes()).createdBy(username)
                .tankDistributions(new ArrayList<>()).build();
        Transaction saved = txRepo.save(tx);
        logService.log(username, "Production", "Huile " + req.getOutputOilQty() + "L dans citerne " +
                req.getOutputTankId(), req.getOutputOilQty() * req.getUnitCost());
        log.info("Production: {}L oil -> tank {}", req.getOutputOilQty(), req.getOutputTankId());
        return saved;
    }
}

