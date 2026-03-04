package com.olivepro.repository;

import com.olivepro.domain.MobileStockItem;
import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MobileStockItemRepository extends JpaRepository<MobileStockItem, Long> {
    List<MobileStockItem> findByVehicleId(Long vehicleId);
    Optional<MobileStockItem> findByVehicleIdAndBrandAndBottleSize(Long vehicleId, Brand brand, BottleSize bottleSize);
}

