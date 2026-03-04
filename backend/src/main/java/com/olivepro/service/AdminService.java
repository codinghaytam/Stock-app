package com.olivepro.service;

import com.olivepro.domain.User;
import com.olivepro.dto.response.MeResponse;
import com.olivepro.exception.BusinessRuleException;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService logService;

    public AdminService(UserRepository userRepo, PasswordEncoder passwordEncoder, ActivityLogService logService) {
        this.userRepo = userRepo; this.passwordEncoder = passwordEncoder; this.logService = logService;
    }

    public List<MeResponse> getAllUsers() {
        return userRepo.findAll().stream().map(u -> new MeResponse(
                u.getId(), u.getUsername(), u.getRole(), u.isBlocked(), u.getVehicleId(), u.getLastLogin()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void blockUser(String targetUsername, String callerUsername) {
        User user = userRepo.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));
        if (user.getRole().name().equals("SUPER_ADMIN"))
            throw new BusinessRuleException("Impossible de bloquer un SUPER_ADMIN");
        user.setBlocked(true);
        userRepo.save(user);
        logService.log(callerUsername, "Admin", "Utilisateur bloqué: " + targetUsername, null);
        log.info("User {} blocked by {}", targetUsername, callerUsername);
    }

    @Transactional
    public void unblockUser(String targetUsername, String callerUsername) {
        User user = userRepo.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));
        user.setBlocked(false);
        userRepo.save(user);
        logService.log(callerUsername, "Admin", "Utilisateur débloqué: " + targetUsername, null);
        log.info("User {} unblocked by {}", targetUsername, callerUsername);
    }

    @Transactional
    public MeResponse createSellerUser(String plateNumber, Long vehicleId, String callerUsername) {
        if (userRepo.findByUsername(plateNumber.toUpperCase()).isPresent())
            throw new BusinessRuleException("Utilisateur déjà existant: " + plateNumber);
        User user = User.builder()
                .username(plateNumber.toUpperCase())
                .passwordHash(passwordEncoder.encode("ZITLBLAD2004"))
                .role(com.olivepro.enums.UserRole.SELLER)
                .isBlocked(false).vehicleId(vehicleId)
                .lastLogin(LocalDateTime.now()).build();
        User saved = userRepo.save(user);
        logService.log(callerUsername, "Admin", "Nouveau vendeur créé: " + plateNumber, null);
        return new MeResponse(saved.getId(), saved.getUsername(), saved.getRole(),
                saved.isBlocked(), saved.getVehicleId(), saved.getLastLogin());
    }
}

