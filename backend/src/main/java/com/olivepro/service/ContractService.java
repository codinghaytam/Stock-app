package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.*;
import com.olivepro.dto.response.ContractStatsResponse;
import com.olivepro.enums.ContractStatus;
import com.olivepro.exception.BusinessRuleException;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ContractService {

    private static final Logger log = LoggerFactory.getLogger(ContractService.class);

    private final ContractRepository contractRepo;
    private final ContractAllocationRepository allocationRepo;
    private final TankService tankService;
    private final TankRepository tankRepo;
    private final ActivityLogService logService;

    public ContractService(ContractRepository contractRepo, ContractAllocationRepository allocationRepo,
                           TankService tankService, TankRepository tankRepo, ActivityLogService logService) {
        this.contractRepo = contractRepo; this.allocationRepo = allocationRepo;
        this.tankService = tankService; this.tankRepo = tankRepo; this.logService = logService;
    }

    public List<Contract> getAll() { return contractRepo.findAll(); }

    public Contract getById(Long id) {
        return contractRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
    }

    @Transactional
    public Contract create(ContractRequest req, String username) {
        Contract c = Contract.builder()
                .clientName(req.getClientName()).reference(req.getReference())
                .targetQuantity(req.getTargetQuantity()).targetAcidity(req.getTargetAcidity())
                .targetWaxes(req.getTargetWaxes()).priceSell(req.getPriceSell())
                .notes(req.getNotes()).createdBy(username).build();
        logService.log(username, "Contrat", "Nouveau: " + req.getClientName() + " " + req.getTargetQuantity() + "L", null);
        return contractRepo.save(c);
    }

    @Transactional
    public Contract updateStatus(Long id, ContractStatus status, String username) {
        Contract c = getById(id);
        c.setStatus(status);
        logService.log(username, "Contrat", "Statut: " + status + " pour " + c.getClientName(), null);
        return contractRepo.save(c);
    }

    @Transactional
    public ContractAllocation allocate(ContractAllocationRequest req, String username) {
        Contract contract = getById(req.getContractId());
        if (contract.getStatus() != ContractStatus.EN_COURS)
            throw new BusinessRuleException("Contrat non actif: " + contract.getStatus());
        Tank tank = tankService.getById(req.getTankId());
        // Snapshot tank quality at time of allocation
        ContractAllocation alloc = ContractAllocation.builder()
                .contract(contract).tankId(req.getTankId()).quantity(req.getQuantity())
                .acidityAtAllocation(tank.getAcidity()).waxesAtAllocation(tank.getWaxes())
                .costPrice(tank.getAvgCost()).createdBy(username).build();
        // Drain the tank
        tankService.drain(req.getTankId(), req.getQuantity());
        allocationRepo.save(alloc);
        // Recompute progress
        double totalAllocated = allocationRepo.sumQuantityByContractId(req.getContractId());
        double progress = contract.getTargetQuantity() > 0
                ? Math.min(100, (totalAllocated / contract.getTargetQuantity()) * 100) : 0;
        contract.setProgressPercentage(progress);
        if (totalAllocated >= contract.getTargetQuantity()) contract.setStatus(ContractStatus.TERMINE);
        contractRepo.save(contract);
        logService.log(username, "Contrat Allocation", contract.getClientName() + " +" + req.getQuantity() + "L", null);
        return alloc;
    }

    public ContractStatsResponse getStats(Long contractId) {
        Contract c = getById(contractId);
        List<ContractAllocation> allocations = allocationRepo.findByContractId(contractId);
        double totalAllocated = allocations.stream().mapToDouble(ContractAllocation::getQuantity).sum();
        double avgAcidity = allocations.stream().mapToDouble(a -> a.getAcidityAtAllocation() * a.getQuantity()).sum()
                / (totalAllocated > 0 ? totalAllocated : 1);
        double avgWaxes = allocations.stream().mapToDouble(a -> a.getWaxesAtAllocation() * a.getQuantity()).sum()
                / (totalAllocated > 0 ? totalAllocated : 1);
        double totalCost = allocations.stream().mapToDouble(a -> a.getCostPrice() * a.getQuantity()).sum();
        double totalRevenue = totalAllocated * c.getPriceSell();
        double profit = totalRevenue - totalCost;
        double margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        return new ContractStatsResponse(totalAllocated, c.getProgressPercentage(),
                avgAcidity, avgWaxes, totalCost, totalRevenue, profit, margin);
    }
}

