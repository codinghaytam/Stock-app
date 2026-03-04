package com.olivepro.repository;

import com.olivepro.domain.FuelLog;
import com.olivepro.enums.FuelLogType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {
    List<FuelLog> findByType(FuelLogType type);
    List<FuelLog> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(f.quantity),0) FROM FuelLog f WHERE f.type = 'ACHAT'")
    double sumPurchased();

    @Query("SELECT COALESCE(SUM(f.quantity),0) FROM FuelLog f WHERE f.type = 'CONSOMMATION'")
    double sumConsumed();
}

