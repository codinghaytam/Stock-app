package com.olivepro.repository;

import com.olivepro.domain.Tank;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TankRepository extends JpaRepository<Tank, Long> {
    List<Tank> findAllByOrderByCreatedAtDesc();
}

