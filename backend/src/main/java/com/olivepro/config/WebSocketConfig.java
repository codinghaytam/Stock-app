package com.olivepro.config;

import com.olivepro.websocket.AlertsWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AlertsWebSocketHandler handler;



    public WebSocketConfig(AlertsWebSocketHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/alerts")
                .setAllowedOrigins("*");
    }
}

