package com.olivepro.controller;

import com.olivepro.dto.response.DashboardResponse;
import com.olivepro.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }

    @GetMapping("/summary")
    public ResponseEntity<DashboardResponse> summary() { return ResponseEntity.ok(service.getSummary()); }
}

