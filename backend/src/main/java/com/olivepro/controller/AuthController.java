package com.olivepro.controller;

import com.olivepro.dto.request.LoginRequest;
import com.olivepro.dto.response.LoginResponse;
import com.olivepro.dto.response.MeResponse;
import com.olivepro.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.getUsername(), request.getPassword()));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getMe(userDetails.getUsername()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/alerts")
    public ResponseEntity<Map<String, Object>> getAlerts(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        Map<String, Object> alerts = new HashMap<>();
        alerts.put("unreadEmails", 0);
        alerts.put("urgentChecks", 0);
        alerts.put("lowFuel", 0);
        alerts.put("lowTankCount", 0);
        return ResponseEntity.ok(alerts);
    }
}

