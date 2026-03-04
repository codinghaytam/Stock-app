package com.olivepro.dto.response;

import com.olivepro.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data @AllArgsConstructor
public class MeResponse {
    private Long id;
    private String username;
    private UserRole role;
    private boolean isBlocked;
    private Long vehicleId;
    private LocalDateTime lastLogin;
}

