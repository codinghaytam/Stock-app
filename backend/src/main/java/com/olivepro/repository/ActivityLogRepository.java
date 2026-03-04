package com.olivepro.repository;

import com.olivepro.domain.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<ActivityLog> findByUsernameOrderByCreatedAtDesc(String username);
}

