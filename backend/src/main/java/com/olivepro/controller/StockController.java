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
        return ResponseEntity.ok(service.addOrMerge(req, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails user) {
        service.deleteStock(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}

