package com.olivepro.controller;

import com.olivepro.domain.FuelLog;
import com.olivepro.dto.request.FuelLogRequest;
import com.olivepro.dto.response.FuelStatsResponse;
import com.olivepro.service.FuelService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/fuel")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class FuelController {

    private final FuelService service;
    public FuelController(FuelService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<FuelLog>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @GetMapping("/stats")
    public ResponseEntity<FuelStatsResponse> stats() { return ResponseEntity.ok(service.getStats()); }

    @PostMapping
    public ResponseEntity<FuelLog> add(@Valid @RequestBody FuelLogRequest req,
                                        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.addLog(req, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deleteLog(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}

