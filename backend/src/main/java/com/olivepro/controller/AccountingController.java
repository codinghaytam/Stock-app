package com.olivepro.controller;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.dto.response.CaisseResponse;
import com.olivepro.service.AccountingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AccountingController {

    private final AccountingService service;
    public AccountingController(AccountingService service) { this.service = service; }

    // ── Caisse ──────────────────────────────────────────────────────────────
    @GetMapping("/caisse")
    public ResponseEntity<CaisseResponse> getCaisse() {
        double bankBalance = service.getBankAccounts().stream().mapToDouble(BankAccount::getBalance).sum();
        double receivables = service.computeTotalReceivables();
        double payables = service.computeTotalPayables();
        return ResponseEntity.ok(new CaisseResponse(
                service.getCaisseUsine(), service.getCaisseDirecteur(),
                service.getNetProfit(), receivables, payables, bankBalance));
    }

    @PostMapping("/cash/manual")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> manualCash(@RequestBody Map<String, Object> body,
                                           @AuthenticationPrincipal UserDetails user) {
        double amount = Double.parseDouble(body.get("amount").toString());
        String desc = (String) body.getOrDefault("description", "Opération manuelle");
        service.manualCash(amount, desc, user.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cash/transfer-bank")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> transferBank(@RequestBody Map<String, Object> body,
                                             @AuthenticationPrincipal UserDetails user) {
        Long bankAccountId = Long.valueOf(body.get("bankAccountId").toString());
        double amount = Double.parseDouble(body.get("amount").toString());
        service.transferToBank(bankAccountId, amount, user.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cash/transfer-directeur")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> transferDirector(@RequestBody Map<String, Object> body,
                                                 @AuthenticationPrincipal UserDetails user) {
        double amount = Double.parseDouble(body.get("amount").toString());
        service.transferToDirector(amount, user.getUsername());
        return ResponseEntity.ok().build();
    }

    // ── Expenses ─────────────────────────────────────────────────────────────
    @GetMapping("/expenses")
    public ResponseEntity<List<Expense>> getExpenses() { return ResponseEntity.ok(service.getExpenses()); }

    @PostMapping("/expenses")
    public ResponseEntity<Expense> addExpense(@Valid @RequestBody ExpenseRequest req,
                                               @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.createExpense(req, user.getUsername()));
    }

    @DeleteMapping("/expenses/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deleteExpense(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Checks ────────────────────────────────────────────────────────────────
    @GetMapping("/checks")
    public ResponseEntity<List<BankCheck>> getChecks() { return ResponseEntity.ok(service.getChecks()); }

    @GetMapping("/checks/urgent")
    public ResponseEntity<List<BankCheck>> getUrgent() { return ResponseEntity.ok(service.getUrgentChecks()); }

    @PostMapping("/checks")
    public ResponseEntity<BankCheck> addCheck(@Valid @RequestBody BankCheckRequest req,
                                               @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.createCheck(req, user.getUsername()));
    }

    @PatchMapping("/checks/{id}/status")
    public ResponseEntity<BankCheck> updateStatus(@PathVariable Long id,
                                                    @RequestBody CheckStatusRequest req,
                                                    @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.updateCheckStatus(id, req.getStatus(), user.getUsername()));
    }

    @DeleteMapping("/checks/{id}")
    public ResponseEntity<Void> deleteCheck(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deleteCheck(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Bank Accounts ─────────────────────────────────────────────────────────
    @GetMapping("/bank-accounts")
    public ResponseEntity<List<BankAccount>> getBankAccounts() { return ResponseEntity.ok(service.getBankAccounts()); }

    @PostMapping("/bank-accounts")
    public ResponseEntity<BankAccount> addBankAccount(@Valid @RequestBody BankAccountRequest req,
                                                       @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.createBankAccount(req, user.getUsername()));
    }

    @PutMapping("/bank-accounts/{id}")
    public ResponseEntity<BankAccount> updateBankAccount(@PathVariable Long id,
                                                          @Valid @RequestBody BankAccountRequest req,
                                                          @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.updateBankAccount(id, req, user.getUsername()));
    }
}
