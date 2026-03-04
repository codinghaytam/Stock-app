package com.olivepro.repository;

import com.olivepro.domain.EmailAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailAccountRepository extends JpaRepository<EmailAccount, Long> {
    Optional<EmailAccount> findByAddress(String address);
}

