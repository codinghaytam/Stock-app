package com.olivepro.controller;

import com.olivepro.domain.ActivityLog;
import com.olivepro.service.ActivityLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class ActivityLogController {

    private final ActivityLogService service;
    public ActivityLogController(ActivityLogService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(service.getAll(page, size));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<ActivityLog>> getByUser(@PathVariable String username) {
        return ResponseEntity.ok(service.getByUsername(username));
    }
}

