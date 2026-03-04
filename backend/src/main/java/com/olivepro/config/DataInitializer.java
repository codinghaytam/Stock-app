package com.olivepro.config;

import com.olivepro.domain.EmailAccount;
import com.olivepro.domain.EmailMessage;
import com.olivepro.domain.User;
import com.olivepro.enums.EmailFolder;
import com.olivepro.enums.UserRole;
import com.olivepro.repository.EmailAccountRepository;
import com.olivepro.repository.EmailMessageRepository;
import com.olivepro.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner init(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           EmailAccountRepository emailAccountRepository,
                           EmailMessageRepository emailMessageRepository) {
        return args -> {
            // ── Users ────────────────────────────────────────────────────────
            if (userRepository.count() == 0) {
                log.info("Seeding initial users...");
                userRepository.save(User.builder().username("mojo")
                        .passwordHash(passwordEncoder.encode("hamoda2004"))
                        .role(UserRole.SUPER_ADMIN).isBlocked(false).lastLogin(LocalDateTime.now()).build());
                userRepository.save(User.builder().username("boss")
                        .passwordHash(passwordEncoder.encode("hamoda2004"))
                        .role(UserRole.SUPER_ADMIN).isBlocked(false).lastLogin(LocalDateTime.now()).build());
                userRepository.save(User.builder().username("hajar")
                        .passwordHash(passwordEncoder.encode("hajar2004"))
                        .role(UserRole.ADMIN).isBlocked(false).lastLogin(LocalDateTime.now()).build());
                userRepository.save(User.builder().username("safae")
                        .passwordHash(passwordEncoder.encode("zitlblad2004"))
                        .role(UserRole.ADMIN).isBlocked(false).lastLogin(LocalDateTime.now()).build());
                log.info("Users seeded: {}", userRepository.count());
            }

            // ── Email Accounts ───────────────────────────────────────────────
            if (emailAccountRepository.count() == 0) {
                log.info("Seeding email accounts...");
                EmailAccount direction = emailAccountRepository.save(EmailAccount.builder()
                        .address("direction@olivepro.ma").displayName("Direction").build());
                emailAccountRepository.save(EmailAccount.builder()
                        .address("commercial@olivepro.ma").displayName("Commercial").build());
                emailAccountRepository.save(EmailAccount.builder()
                        .address("rh@olivepro.ma").displayName("Ressources Humaines").build());
                emailAccountRepository.save(EmailAccount.builder()
                        .address("logistique@olivepro.ma").displayName("Logistique").build());

                // Welcome message to direction inbox
                emailMessageRepository.save(EmailMessage.builder()
                        .account(direction).fromAddress("system@olivepro.ma")
                        .toAddress("direction@olivepro.ma")
                        .subject("Bienvenue sur OlivePro")
                        .body("Le système OlivePro a été initialisé avec succès. Bonne gestion !")
                        .folder(EmailFolder.INBOX).isRead(false).build());
                log.info("Email accounts seeded");
            }
        };
    }
}
