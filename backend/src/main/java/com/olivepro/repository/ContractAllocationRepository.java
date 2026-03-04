package com.olivepro.repository;

import com.olivepro.domain.ContractAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ContractAllocationRepository extends JpaRepository<ContractAllocation, Long> {
    List<ContractAllocation> findByContractId(Long contractId);

    @Query("SELECT COALESCE(SUM(a.quantity),0) FROM ContractAllocation a WHERE a.contract.id = ?1")
    double sumQuantityByContractId(Long contractId);
}

