package com.olivepro.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class AlertsPayload {
    private int unreadEmails;
    private int urgentChecks;
    private int lowFuel;
    private int lowTankCount;
}

