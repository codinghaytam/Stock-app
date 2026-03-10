package com.olivepro.controller;

import com.olivepro.domain.EmailAccount;
import com.olivepro.domain.EmailMessage;
import com.olivepro.dto.request.SendEmailRequest;
import com.olivepro.enums.EmailFolder;
import com.olivepro.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@PreAuthorize("isAuthenticated()")
public class EmailController {

    private final EmailService service;
    public EmailController(EmailService service) { this.service = service; }

    @GetMapping("/accounts")
    public ResponseEntity<List<EmailAccount>> accounts() { return ResponseEntity.ok(service.getAccounts()); }

    @PostMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<EmailAccount> createAccount(@Valid @RequestBody EmailAccount account,
                                                      @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.createAccount(account, user.getUsername()));
    }

    @GetMapping("/accounts/{id}/folder/{folder}")
    public ResponseEntity<List<EmailMessage>> folder(@PathVariable Long id,
                                                      @PathVariable EmailFolder folder) {
        return ResponseEntity.ok(service.getFolder(id, folder));
    }

    @GetMapping("/accounts/{id}/unread")
    public ResponseEntity<Map<String, Long>> unread(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("count", service.getUnreadCount(id)));
    }

    @PostMapping("/send")
    public ResponseEntity<EmailMessage> send(@Valid @RequestBody SendEmailRequest req,
                                              @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.send(req, user.getUsername()));
    }

    @PatchMapping("/messages/{id}/read")
    public ResponseEntity<EmailMessage> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(service.markRead(id));
    }

    @PatchMapping("/messages/{id}/trash")
    public ResponseEntity<EmailMessage> moveToTrash(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.moveToTrash(id, user.getUsername()));
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deleteMessage(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
