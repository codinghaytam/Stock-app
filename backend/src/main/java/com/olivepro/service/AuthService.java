package com.olivepro.service;

import com.olivepro.domain.User;
import com.olivepro.dto.response.LoginResponse;
import com.olivepro.dto.response.MeResponse;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.UserRepository;
import com.olivepro.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil, UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    public LoginResponse login(String username, String password) {
        log.info("Attempting login for user={}", username);
        Authentication auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        claims.put("vehicleId", user.getVehicleId());

        String token = jwtUtil.generateToken(username, claims);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        log.info("User {} authenticated successfully", username);
        return new LoginResponse(token, user.getUsername(), user.getRole().name(), user.getVehicleId());
    }

    public MeResponse getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return new MeResponse(user.getId(), user.getUsername(), user.getRole(),
                user.isBlocked(), user.getVehicleId(), user.getLastLogin());
    }

    public void logout() {
        // Stateless JWT — no server-side invalidation needed
        log.info("Logout called (stateless JWT)");
    }
}
