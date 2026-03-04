package com.olivepro.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AlertsSessionRegistry {
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void register(String sessionId, WebSocketSession session) {
        sessions.put(sessionId, session);
    }

    public void remove(String sessionId) {
        sessions.remove(sessionId);
    }

    public Collection<WebSocketSession> getAll() {
        return sessions.values();
    }
}

