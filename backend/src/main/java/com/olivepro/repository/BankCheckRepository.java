package com.olivepro.repository;

import com.olivepro.domain.BankCheck;
import com.olivepro.enums.CheckStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface BankCheckRepository extends JpaRepository<BankCheck, Long> {
    List<BankCheck> findByStatus(CheckStatus status);
    List<BankCheck> findByStatusAndDueDateBefore(CheckStatus status, LocalDate date);
    long countByStatus(CheckStatus status);
}

