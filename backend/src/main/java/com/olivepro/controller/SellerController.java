package com.olivepro.controller;

import com.olivepro.domain.MobileStockItem;
import com.olivepro.domain.Transaction;
import com.olivepro.dto.request.CashDropRequest;
import com.olivepro.dto.request.MobileSaleRequest;
import com.olivepro.dto.request.TransactionRequest;
import com.olivepro.dto.response.SellerStatsResponse;
import com.olivepro.enums.*;
import com.olivepro.service.TransactionService;
import com.olivepro.service.VehicleService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.olivepro.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/seller")
@PreAuthorize("hasRole('SELLER')")
public class SellerController {

    private final VehicleService vehicleService;
    private final TransactionService transactionService;
    private final UserRepository userRepository;

    public SellerController(VehicleService vehicleService, TransactionService transactionService,
                             UserRepository userRepository) {
        this.vehicleService = vehicleService;
        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    private Long getVehicleId(UserDetails user) {
        return userRepository.findByUsername(user.getUsername())
                .map(u -> u.getVehicleId())
                .orElseThrow(() -> new com.olivepro.exception.UnauthorizedException("No vehicleId for user"));
    }

    @GetMapping("/my-stock")
    public ResponseEntity<List<MobileStockItem>> myStock(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(vehicleService.getMobileStock(getVehicleId(user)));
    }

    @GetMapping("/my-stats")
    public ResponseEntity<SellerStatsResponse> myStats(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(vehicleService.getSellerStats(getVehicleId(user)));
    }

    @PostMapping("/sale")
    public ResponseEntity<List<Transaction>> sale(@Valid @RequestBody MobileSaleRequest req,
                                                   @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(vehicleService.mobileSale(getVehicleId(user), req, user.getUsername()));
    }

    @PostMapping("/cash-drop")
    public ResponseEntity<Transaction> cashDrop(@Valid @RequestBody CashDropRequest req,
                                                 @AuthenticationPrincipal UserDetails user) {
        Long vehicleId = getVehicleId(user);
        TransactionRequest txReq = new TransactionRequest();
        txReq.setType(TransactionType.VERSEMENT);
        txReq.setPriceTotal(req.getAmount());
        txReq.setAmountPaid(req.getAmount());
        txReq.setPaymentMethod(PaymentMethod.ESPECE);
        txReq.setPaymentStatus(PaymentStatus.PAYE);
        txReq.setVehicleId(vehicleId);
        txReq.setNotes(req.getNotes());
        txReq.setExchangeRate(1.0);
        txReq.setCurrency(Currency.MAD);
        txReq.setTankDistributions(new ArrayList<>());
        return ResponseEntity.ok(transactionService.create(txReq, user.getUsername()));
    }
}

