package com.olivepro.websocket;

import com.olivepro.repository.UserRepository;
import com.olivepro.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class AlertsWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AlertsWebSocketHandler.class);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AlertsSessionRegistry registry;
    private final AlertsBroadcaster broadcaster;

    public AlertsWebSocketHandler(JwtUtil jwtUtil, UserRepository userRepository,
                                   AlertsSessionRegistry registry, AlertsBroadcaster broadcaster) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.registry = registry;
        this.broadcaster = broadcaster;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        String token = extractToken(query);
        if (token == null) {
            log.warn("WS connection rejected — no token");
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        try {
            Claims claims = jwtUtil.parseClaims(token);
            String username = claims.getSubject();
            var userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty() || userOpt.get().isBlocked()) {
                log.warn("WS connection rejected — user {} blocked or not found", username);
                session.close(CloseStatus.NOT_ACCEPTABLE);
                return;
            }
            registry.register(session.getId(), session);
            log.info("WS connected: {} (user={})", session.getId(), username);
            // send current alerts immediately
            broadcaster.broadcast();
        } catch (Exception e) {
            log.warn("WS connection rejected — invalid token: {}", e.getMessage());
            session.close(CloseStatus.NOT_ACCEPTABLE);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        registry.remove(session.getId());
        log.info("WS disconnected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // client messages are ignored; server pushes only
    }

    private String extractToken(String query) {
        if (query == null) return null;
        for (String param : query.split("&")) {
            if (param.startsWith("token=")) return param.substring(6);
        }
        return null;
    }
}

