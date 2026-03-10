package com.olivepro.controller;

import com.olivepro.domain.Transaction;
import com.olivepro.dto.request.TransactionRequest;
import com.olivepro.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class TransactionController {

    private final TransactionService service;
    public TransactionController(TransactionService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getById(id)); }

    @PostMapping
    public ResponseEntity<Transaction> create(@Valid @RequestBody TransactionRequest req,
                                               @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.create(req, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.delete(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/partners/report")
    public ResponseEntity<List<Map<String, Object>>> partnerReport() {
        return ResponseEntity.ok(service.partnerReport());
    }

    @GetMapping("/partners/{name}/balance")
    public ResponseEntity<Map<String, Object>> partnerBalance(@PathVariable String name) {
        double bal = service.partnerBalance(name);
        return ResponseEntity.ok(Map.of("partnerName", name, "balance", bal));
    }
}
