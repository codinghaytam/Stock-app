package com.olivepro.service;

import com.olivepro.domain.ActivityLog;
import com.olivepro.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);
    private final ActivityLogRepository repo;

    public ActivityLogService(ActivityLogRepository repo) { this.repo = repo; }

    public void log(String username, String action, String details, Double financialAmount) {
        ActivityLog entry = ActivityLog.builder()
                .username(username).action(action).details(details)
                .financialAmount(financialAmount).build();
        repo.save(entry);
        log.info("ActivityLog [{}] {} - {}", username, action, details);
    }

    public List<ActivityLog> getAll(int page, int size) {
        return repo.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    public List<ActivityLog> getByUsername(String username) {
        return repo.findByUsernameOrderByCreatedAtDesc(username);
    }
}

