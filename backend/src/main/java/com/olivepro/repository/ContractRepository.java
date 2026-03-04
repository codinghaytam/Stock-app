package com.olivepro.repository;

import com.olivepro.domain.Contract;
import com.olivepro.enums.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByStatus(ContractStatus status);
}

