package com.olivepro.controller;

import com.olivepro.dto.response.MeResponse;
import com.olivepro.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }

    @GetMapping("/users")
    public ResponseEntity<List<MeResponse>> users() { return ResponseEntity.ok(service.getAllUsers()); }

    @PostMapping("/users/seller")
    public ResponseEntity<MeResponse> createSeller(@RequestBody Map<String, Object> body,
                                                    @AuthenticationPrincipal UserDetails caller) {
        String plate = (String) body.get("plateNumber");
        Long vehicleId = body.get("vehicleId") != null ? Long.valueOf(body.get("vehicleId").toString()) : null;
        return ResponseEntity.status(201).body(service.createSellerUser(plate, vehicleId, caller.getUsername()));
    }

    @PostMapping("/users/block")
    public ResponseEntity<Void> block(@RequestBody Map<String, String> body,
                                       @AuthenticationPrincipal UserDetails caller) {
        service.blockUser(body.get("username"), caller.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/unblock")
    public ResponseEntity<Void> unblock(@RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal UserDetails caller) {
        service.unblockUser(body.get("username"), caller.getUsername());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, @AuthenticationPrincipal UserDetails caller) {
        service.deleteUser(id, caller.getUsername());
        return ResponseEntity.noContent().build();
    }
}
