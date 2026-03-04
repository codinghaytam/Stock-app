package com.olivepro.repository;

import com.olivepro.domain.StockItem;
import com.olivepro.enums.Brand;
import com.olivepro.enums.BottleSize;
import com.olivepro.enums.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StockItemRepository extends JpaRepository<StockItem, Long> {
    List<StockItem> findByProductType(ProductType type);
    Optional<StockItem> findByProductTypeAndNameAndBrandAndBottleSize(ProductType type, String name, Brand brand, BottleSize bottleSize);
    Optional<StockItem> findFirstByProductType(ProductType type);
}

