package com.olivepro.repository;

import com.olivepro.domain.EmailMessage;
import com.olivepro.enums.EmailFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmailMessageRepository extends JpaRepository<EmailMessage, Long> {
    List<EmailMessage> findByAccountIdAndFolderOrderByCreatedAtDesc(Long accountId, EmailFolder folder);
    long countByAccountIdAndFolderAndIsReadFalse(Long accountId, EmailFolder folder);
    long countByFolderAndIsReadFalse(EmailFolder folder);
}

