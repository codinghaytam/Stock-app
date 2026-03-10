package com.olivepro.controller;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.dto.response.SellerStatsResponse;
import com.olivepro.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class VehicleController {

    private final VehicleService service;
    public VehicleController(VehicleService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getById(id)); }

    @PostMapping
    public ResponseEntity<Vehicle> create(@Valid @RequestBody VehicleRequest req,
                                           @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.create(req, user.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> update(@PathVariable Long id, @Valid @RequestBody VehicleRequest req,
                                           @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.update(id, req, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.delete(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/load")
    public ResponseEntity<Vehicle> load(@PathVariable Long id,
                                         @Valid @RequestBody LoadVehicleRequest req,
                                         @AuthenticationPrincipal UserDetails user) {
        req.setVehicleId(id);
        return ResponseEntity.ok(service.loadVehicle(req, user.getUsername()));
    }

    @GetMapping("/{id}/mobile-stock")
    public ResponseEntity<List<MobileStockItem>> getMobileStock(@PathVariable Long id) {
        return ResponseEntity.ok(service.getMobileStock(id));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<SellerStatsResponse> getStats(@PathVariable Long id) {
        return ResponseEntity.ok(service.getSellerStats(id));
    }

    @PostMapping("/{id}/sale")
    public ResponseEntity<List<Transaction>> sale(@PathVariable Long id,
                                                   @Valid @RequestBody MobileSaleRequest req,
                                                   @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.mobileSale(id, req, user.getUsername()));
    }
}
