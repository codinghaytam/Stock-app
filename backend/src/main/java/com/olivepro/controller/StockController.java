package com.olivepro.controller;

import com.olivepro.domain.StockItem;
import com.olivepro.dto.request.StockItemRequest;
import com.olivepro.service.StockService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService service;
    public StockController(StockService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','SELLER')")
    public ResponseEntity<List<StockItem>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<StockItem> add(@Valid @RequestBody StockItemRequest req,
                                          @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.addOrMerge(req, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails user) {
        service.deleteStock(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/quantity")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<StockItem> adjustQuantity(@PathVariable Long id,
                                                     @RequestBody(required = true) java.util.Map<String, Double> body,
                                                     @AuthenticationPrincipal UserDetails user) {
        Double delta = body.get("delta");
        if (delta == null) return ResponseEntity.badRequest().build();
        if (delta < 0) {
            // decrease
            service.decreaseStock(id, Math.abs(delta), user.getUsername());
        } else if (delta > 0) {
            // increase by merging into existing item (create a simple request)
            // Fetch existing item and update quantity
            StockItem si = service.getById(id);
            si.setQuantity(si.getQuantity() + delta);
            // Save via service: there is no direct save, so use addOrMerge with minimal request
            com.olivepro.dto.request.StockItemRequest r = new com.olivepro.dto.request.StockItemRequest();
            r.setName(si.getName()); r.setProductType(si.getProductType()); r.setQuantity((int)si.getQuantity());
            r.setUnit(si.getUnit()); r.setPricePerUnit(si.getPricePerUnit()); r.setBrand(si.getBrand()); r.setBottleSize(si.getBottleSize());
            StockItem updated = service.addOrMerge(r, user.getUsername());
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.ok(service.getById(id));
    }
}
