package com.olivepro.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.olivepro.domain.Invoice;
import com.olivepro.domain.InvoiceItem;
import com.olivepro.dto.request.InvoiceRequest;
import com.olivepro.dto.response.InvoiceResponse;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.InvoiceRepository;
import com.olivepro.util.NumberToWordsFr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    private final InvoiceRepository repo;
    private final ActivityLogService logService;

    public InvoiceService(InvoiceRepository repo, ActivityLogService logService) {
        this.repo = repo; this.logService = logService;
    }

    public List<InvoiceResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public InvoiceResponse getById(Long id) {
        return toResponse(findById(id));
    }

    private Invoice findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
    }

    @Transactional
    public InvoiceResponse create(InvoiceRequest req, String username) {
        // Sequential invoice number per year
        String number = generateNumber();
        // Compute totals
        double totalHT = req.getItems().stream().mapToDouble(i -> i.getQuantity() * i.getUnitPrice()).sum();
        double tvaAmount = totalHT * req.getTvaRate();
        double totalTTC = totalHT + tvaAmount;
        String amountInWords = NumberToWordsFr.convert(totalTTC);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(number).clientName(req.getClientName())
                .clientAddress(req.getClientAddress()).clientIce(req.getClientIce())
                .date(req.getDate()).tvaRate(req.getTvaRate())
                .totalHT(totalHT).tvaAmount(tvaAmount).totalTTC(totalTTC)
                .amountInWords(amountInWords).paymentMode(req.getPaymentMode())
                .notes(req.getNotes()).createdBy(username)
                .items(new ArrayList<>()).build();

        for (var dto : req.getItems()) {
            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice).description(dto.getDescription())
                    .quantity(dto.getQuantity()).unit(dto.getUnit())
                    .unitPrice(dto.getUnitPrice())
                    .totalPrice(dto.getQuantity() * dto.getUnitPrice()).build();
            invoice.getItems().add(item);
        }
        Invoice saved = repo.save(invoice);
        logService.log(username, "Facture", "N°" + number + " - " + req.getClientName(), totalTTC);
        log.info("Invoice {} created for {}", number, req.getClientName());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id, String username) {
        repo.deleteById(id);
        logService.log(username, "Facture", "Suppression id=" + id, null);
    }

    public byte[] generatePdf(Long id) {
        Invoice inv = findById(id);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(36, 36, 36, 36);

            // Header
            doc.add(new Paragraph("FACTURE")
                    .setBold().setFontSize(22).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("N° " + inv.getInvoiceNumber() + "   |   " +
                    inv.getDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .setFontSize(11).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("\n"));

            // Client info
            doc.add(new Paragraph("Client: " + inv.getClientName()).setBold());
            if (inv.getClientAddress() != null)
                doc.add(new Paragraph("Adresse: " + inv.getClientAddress()));
            if (inv.getClientIce() != null)
                doc.add(new Paragraph("ICE: " + inv.getClientIce()));
            doc.add(new Paragraph("\n"));

            // Items table
            Table table = new Table(UnitValue.createPercentArray(new float[]{5, 45, 10, 15, 15, 15}))
                    .useAllAvailableWidth();
            for (String h : new String[]{"#", "Description", "Qté", "Unité", "Prix Unit.", "Total"}) {
                table.addHeaderCell(new Cell().add(new Paragraph(h).setBold())
                        .setBackgroundColor(ColorConstants.LIGHT_GRAY));
            }
            int i = 1;
            for (InvoiceItem item : inv.getItems()) {
                table.addCell(String.valueOf(i++));
                table.addCell(item.getDescription());
                table.addCell(String.valueOf(item.getQuantity()));
                table.addCell(item.getUnit() != null ? item.getUnit() : "");
                table.addCell(String.format("%.2f", item.getUnitPrice()));
                table.addCell(String.format("%.2f", item.getTotalPrice()));
            }
            doc.add(table);
            doc.add(new Paragraph("\n"));

            // Totals
            doc.add(new Paragraph(String.format("Sous-total HT : %.2f MAD", inv.getTotalHT()))
                    .setTextAlignment(TextAlignment.RIGHT));
            doc.add(new Paragraph(String.format("TVA (%.0f%%) : %.2f MAD",
                    inv.getTvaRate() * 100, inv.getTvaAmount()))
                    .setTextAlignment(TextAlignment.RIGHT));
            doc.add(new Paragraph(String.format("TOTAL TTC : %.2f MAD", inv.getTotalTTC()))
                    .setBold().setFontSize(13).setTextAlignment(TextAlignment.RIGHT));
            doc.add(new Paragraph("\n"));

            // Amount in words
            doc.add(new Paragraph("Arrêtée la présente facture à la somme de :")
                    .setItalic());
            doc.add(new Paragraph(inv.getAmountInWords()).setBold().setFontSize(11));

            if (inv.getPaymentMode() != null)
                doc.add(new Paragraph("Mode de règlement: " + inv.getPaymentMode()));

            doc.close();
            log.info("PDF generated for invoice {}", inv.getInvoiceNumber());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("PDF generation failed for invoice {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage(), e);
        }
    }

    private String generateNumber() {
        int year = java.time.LocalDate.now().getYear() % 100;
        var latest = repo.findLatest();
        int seq = 1;
        if (latest.isPresent()) {
            String num = latest.get().getInvoiceNumber();
            try {
                String[] parts = num.split("/");
                int existingYear = Integer.parseInt(parts[parts.length - 1]);
                if (existingYear == year) seq = Integer.parseInt(parts[0]) + 1;
            } catch (Exception ignored) {}
        }
        return seq + "/" + String.format("%02d", year);
    }

    private InvoiceResponse toResponse(Invoice inv) {
        InvoiceResponse r = new InvoiceResponse();
        r.setId(inv.getId()); r.setInvoiceNumber(inv.getInvoiceNumber());
        r.setClientName(inv.getClientName()); r.setClientAddress(inv.getClientAddress());
        r.setClientIce(inv.getClientIce()); r.setDate(inv.getDate());
        r.setTvaRate(inv.getTvaRate()); r.setTotalHT(inv.getTotalHT());
        r.setTvaAmount(inv.getTvaAmount()); r.setTotalTTC(inv.getTotalTTC());
        r.setAmountInWords(inv.getAmountInWords()); r.setPaymentMode(inv.getPaymentMode());
        r.setNotes(inv.getNotes()); r.setCreatedBy(inv.getCreatedBy());
        r.setCreatedAt(inv.getCreatedAt());
        r.setItems(inv.getItems().stream().map(item -> {
            InvoiceResponse.ItemDto d = new InvoiceResponse.ItemDto();
            d.setId(item.getId()); d.setDescription(item.getDescription());
            d.setQuantity(item.getQuantity()); d.setUnit(item.getUnit());
            d.setUnitPrice(item.getUnitPrice()); d.setTotalPrice(item.getTotalPrice());
            return d;
        }).collect(Collectors.toList()));
        return r;
    }
}

