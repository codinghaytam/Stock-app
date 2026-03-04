package com.olivepro.controller;

import com.olivepro.domain.Tank;
import com.olivepro.dto.request.TankRequest;
import com.olivepro.dto.request.TankTransferRequest;
import com.olivepro.service.TankService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tanks")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class TankController {

    private final TankService service;
    public TankController(TankService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<Tank>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Tank> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getById(id)); }

    @PostMapping
    public ResponseEntity<Tank> create(@Valid @RequestBody TankRequest req,
                                        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.create(req, user.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tank> update(@PathVariable Long id, @Valid @RequestBody TankRequest req,
                                        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.update(id, req, user.getUsername()));
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
}

