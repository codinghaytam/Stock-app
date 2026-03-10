package com.olivepro.controller;

import com.olivepro.dto.request.InvoiceRequest;
import com.olivepro.dto.response.InvoiceResponse;
import com.olivepro.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class InvoiceController {

    private final InvoiceService service;
    public InvoiceController(InvoiceService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getById(@PathVariable Long id) { return ResponseEntity.ok(service.getById(id)); }

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(@Valid @RequestBody InvoiceRequest req,
                                                   @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(service.create(req, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.delete(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        byte[] bytes = service.generatePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"facture-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/next-number")
    public ResponseEntity<Object> nextNumber() {
        String next = service.previewNextNumber();
        return ResponseEntity.ok(java.util.Map.of("nextNumber", next));
    }
}
