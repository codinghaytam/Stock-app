package com.olivepro.service;

import com.olivepro.domain.StockItem;
import com.olivepro.dto.request.StockItemRequest;
import com.olivepro.exception.InsufficientStockException;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.StockItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);
    private final StockItemRepository repo;
    private final ActivityLogService logService;

    public StockService(StockItemRepository repo, ActivityLogService logService) {
        this.repo = repo; this.logService = logService;
    }

    public List<StockItem> getAll() { return repo.findAll(); }

    public StockItem getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("StockItem not found: " + id));
    }

    @Transactional
    public StockItem addOrMerge(StockItemRequest req, String username) {
        var existing = repo.findByProductTypeAndNameAndBrandAndBottleSize(
                req.getProductType(), req.getName(), req.getBrand(), req.getBottleSize());
        if (existing.isPresent()) {
            StockItem s = existing.get();
            s.setQuantity(s.getQuantity() + req.getQuantity());
            log.info("Merged stock {} +{}", s.getName(), req.getQuantity());
            logService.log(username, "Stock", "Merge: " + s.getName() + " +" + req.getQuantity(), null);
            return repo.save(s);
        }
        StockItem s = StockItem.builder()
                .name(req.getName()).productType(req.getProductType())
                .quantity(req.getQuantity()).unit(req.getUnit())
                .pricePerUnit(req.getPricePerUnit())
                .brand(req.getBrand()).bottleSize(req.getBottleSize()).build();
        logService.log(username, "Stock", "Ajout: " + s.getName(), null);
        return repo.save(s);
    }

    @Transactional
    public void decreaseStock(Long id, double qty, String username) {
        StockItem s = getById(id);
        if (s.getQuantity() < qty)
            throw new InsufficientStockException("Stock insuffisant pour " + s.getName() +
                    ". Disponible: " + s.getQuantity() + ", Demandé: " + qty);
        s.setQuantity(s.getQuantity() - qty);
        repo.save(s);
        log.info("Stock decreased {} -{}", s.getName(), qty);
    }

    @Transactional
    public StockItem mergeOrCreateByType(com.olivepro.enums.ProductType type, double qty) {
        var existing = repo.findFirstByProductType(type);
        if (existing.isPresent()) {
            StockItem s = existing.get();
            s.setQuantity(s.getQuantity() + qty);
            return repo.save(s);
        }
        return repo.save(StockItem.builder()
                .name(type.name()).productType(type).quantity(qty).unit("kg").build());
    }

    @Transactional
    public void deleteStock(Long id, String username) {
        repo.deleteById(id);
        logService.log(username, "Stock", "Suppression id=" + id, null);
    }
}

