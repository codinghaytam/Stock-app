package com.olivepro.controller;

import com.olivepro.domain.Transaction;
import com.olivepro.dto.request.ProductionRequest;
import com.olivepro.service.ProductionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/production")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class ProductionController {

    private final ProductionService service;
    public ProductionController(ProductionService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<Transaction> produce(@Valid @RequestBody ProductionRequest req,
                                                @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.produce(req, user.getUsername()));
    }
}

