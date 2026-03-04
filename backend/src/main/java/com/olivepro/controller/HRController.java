package com.olivepro.controller;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.dto.response.SalaryCalculationResponse;
import com.olivepro.service.HRService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hr")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class HRController {

    private final HRService service;
    public HRController(HRService service) { this.service = service; }

    @GetMapping("/employees")
    public ResponseEntity<List<Employee>> employees() { return ResponseEntity.ok(service.getEmployees()); }

    @PostMapping("/employees")
    public ResponseEntity<Employee> addEmployee(@Valid @RequestBody EmployeeRequest req,
                                                 @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.createEmployee(req, user.getUsername()));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id,
                                                    @Valid @RequestBody EmployeeRequest req,
                                                    @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.updateEmployee(id, req, user.getUsername()));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deactivateEmployee(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/attendance")
    public ResponseEntity<AttendanceRecord> mark(@Valid @RequestBody AttendanceRequest req,
                                                  @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.markAttendance(req, user.getUsername()));
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceRecord>> getAttendance(
            @RequestParam Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getAttendance(employeeId, from, to));
    }

    @GetMapping("/salaries/calculate")
    public ResponseEntity<SalaryCalculationResponse> calculate(
            @RequestParam Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.calculateSalary(employeeId, from, to));
    }

    @PostMapping("/salaries/pay")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SalaryPayment> pay(@Valid @RequestBody SalaryPaymentRequest req,
                                              @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.paySalary(req, user.getUsername()));
    }

    @GetMapping("/salaries")
    public ResponseEntity<List<SalaryPayment>> salaries(@RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(service.getSalaryPayments(employeeId));
    }
}

