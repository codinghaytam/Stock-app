package com.olivepro.controller;

import com.olivepro.domain.Contract;
import com.olivepro.domain.ContractAllocation;
import com.olivepro.dto.request.ContractAllocationRequest;
import com.olivepro.dto.request.ContractRequest;
import com.olivepro.dto.response.ContractStatsResponse;
import com.olivepro.enums.ContractStatus;
import com.olivepro.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class ContractController {

    private final ContractService service;
    public ContractController(ContractService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<Contract>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Contract> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getById(id)); }

    @PostMapping
    public ResponseEntity<Contract> create(@Valid @RequestBody ContractRequest req,
                                            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.create(req, user.getUsername()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Contract> updateStatus(@PathVariable Long id,
                                                  @RequestBody Map<String, String> body,
                                                  @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.updateStatus(id, ContractStatus.valueOf(body.get("status")), user.getUsername()));
    }

    @PostMapping("/allocate")
    public ResponseEntity<ContractAllocation> allocate(@Valid @RequestBody ContractAllocationRequest req,
                                                        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.allocate(req, user.getUsername()));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ContractStatsResponse> stats(@PathVariable Long id) {
        return ResponseEntity.ok(service.getStats(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deleteContract(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
