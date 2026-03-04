package com.olivepro.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.olivepro.enums.CheckStatus;
import com.olivepro.enums.EmailFolder;
import com.olivepro.enums.FuelLogType;
import com.olivepro.repository.BankCheckRepository;
import com.olivepro.repository.EmailMessageRepository;
import com.olivepro.repository.FuelLogRepository;
import com.olivepro.repository.TankRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.time.LocalDate;

@Component
public class AlertsBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(AlertsBroadcaster.class);

    private final AlertsSessionRegistry registry;
    private final EmailMessageRepository emailMessageRepo;
    private final BankCheckRepository bankCheckRepo;
    private final FuelLogRepository fuelLogRepo;
    private final TankRepository tankRepo;
    private final ObjectMapper objectMapper;

    @Value("${app.fuel.low-stock-threshold:500}")
    private double fuelThreshold;

    public AlertsBroadcaster(AlertsSessionRegistry registry,
                             EmailMessageRepository emailMessageRepo,
                             BankCheckRepository bankCheckRepo,
                             FuelLogRepository fuelLogRepo,
                             TankRepository tankRepo,
                             ObjectMapper objectMapper) {
        this.registry = registry;
        this.emailMessageRepo = emailMessageRepo;
        this.bankCheckRepo = bankCheckRepo;
        this.fuelLogRepo = fuelLogRepo;
        this.tankRepo = tankRepo;
        this.objectMapper = objectMapper;
    }

    public AlertsPayload computePayload() {
        int unreadEmails = (int) emailMessageRepo.countByFolderAndIsReadFalse(EmailFolder.INBOX);
        int urgentChecks = (int) bankCheckRepo.findByStatusAndDueDateBefore(
                CheckStatus.EN_COFFRE, LocalDate.now().plusDays(4)).size();
        double fuelStock = fuelLogRepo.sumPurchased() - fuelLogRepo.sumConsumed();
        int lowFuel = fuelStock < fuelThreshold ? 1 : 0;
        int lowTankCount = (int) tankRepo.findAll().stream()
                .filter(t -> t.getCapacity() > 0 && t.getCurrentLevel() / t.getCapacity() < 0.15)
                .count();
        return new AlertsPayload(unreadEmails, urgentChecks, lowFuel, lowTankCount);
    }

    public void broadcast() {
        AlertsPayload payload = computePayload();
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize alerts payload", e);
            return;
        }
        for (WebSocketSession session : registry.getAll()) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(json));
                } catch (Exception e) {
                    log.warn("Failed to send to session {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }
}

