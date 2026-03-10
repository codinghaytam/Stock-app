package com.olivepro.controller;

import com.olivepro.domain.Tank;
import com.olivepro.dto.request.TankRequest;
import com.olivepro.dto.request.TankTransferRequest;
import com.olivepro.dto.response.TankResponse;
import com.olivepro.service.TankService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tanks")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class TankController {

    private final TankService service;
    public TankController(TankService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<TankResponse>> getAll() {
        List<Tank> tanks = service.getAll();
        List<TankResponse> resp = tanks.stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TankResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<TankResponse> create(@Valid @RequestBody TankRequest req,
                                        @AuthenticationPrincipal UserDetails user) {
        Tank t = service.create(req, user.getUsername());
        return ResponseEntity.status(201).body(toResponse(t));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TankResponse> update(@PathVariable Long id, @Valid @RequestBody TankRequest req,
                                        @AuthenticationPrincipal UserDetails user) {
        Tank t = service.update(id, req, user.getUsername());
        return ResponseEntity.ok(toResponse(t));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails user) {
        service.delete(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/transfer")
    public ResponseEntity<Void> transfer(@Valid @RequestBody TankTransferRequest req,
                                          @AuthenticationPrincipal UserDetails user) {
        service.transfer(req, user.getUsername());
        return ResponseEntity.ok().build();
    }

    private TankResponse toResponse(Tank t) {
        TankResponse r = new TankResponse();
        r.setId(t.getId()); r.setName(t.getName()); r.setCapacity(t.getCapacity());
        r.setCurrentLevel(t.getCurrentLevel()); r.setAcidity(t.getAcidity()); r.setWaxes(t.getWaxes());
        r.setAvgCost(t.getAvgCost()); r.setStatus(t.getStatus()); r.setNotes(t.getNotes());
        double usage = t.getCapacity() > 0 ? (t.getCurrentLevel() / t.getCapacity()) * 100 : 0;
        r.setUsagePercentage(Math.round(usage * 100.0) / 100.0);
        r.setStockValue(Math.round((t.getCurrentLevel() * t.getAvgCost()) * 100.0) / 100.0);
        r.setAvailableCapacity(Math.round((t.getCapacity() - t.getCurrentLevel()) * 100.0) / 100.0);
        r.setCreatedAt(t.getCreatedAt());
        return r;
    }
}
