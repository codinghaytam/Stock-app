package com.olivepro.service;

import com.olivepro.domain.EmailAccount;
import com.olivepro.domain.EmailMessage;
import com.olivepro.dto.request.SendEmailRequest;
import com.olivepro.enums.EmailFolder;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.EmailAccountRepository;
import com.olivepro.repository.EmailMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final EmailAccountRepository accountRepo;
    private final EmailMessageRepository messageRepo;
    private final ActivityLogService logService;

    public EmailService(EmailAccountRepository accountRepo, EmailMessageRepository messageRepo,
                        ActivityLogService logService) {
        this.accountRepo = accountRepo;
        this.messageRepo = messageRepo;
        this.logService = logService;
    }

    public List<EmailAccount> getAccounts() { return accountRepo.findAll(); }

    @Transactional
    public EmailAccount createAccount(EmailAccount account, String username) {
        EmailAccount saved = accountRepo.save(account);
        logService.log(username, "EmailAccount", "Création: " + saved.getAddress(), null);
        return saved;
    }

    public List<EmailMessage> getFolder(Long accountId, EmailFolder folder) {
        return messageRepo.findByAccountIdAndFolderOrderByCreatedAtDesc(accountId, folder);
    }

    public long getUnreadCount(Long accountId) {
        return messageRepo.countByAccountIdAndFolderAndIsReadFalse(accountId, EmailFolder.INBOX);
    }

    @Transactional
    public EmailMessage send(SendEmailRequest req, String username) {
        EmailAccount sender = accountRepo.findById(req.getFromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("EmailAccount not found: " + req.getFromAccountId()));

        EmailMessage sent = EmailMessage.builder()
                .account(sender)
                .fromAddress(sender.getAddress())
                .toAddress(req.getToAddress())
                .subject(req.getSubject())
                .body(req.getBody())
                .folder(EmailFolder.SENT)
                .isRead(true)
                .build();
        EmailMessage saved = messageRepo.save(sent);

        accountRepo.findByAddress(req.getToAddress()).ifPresent(recipient -> {
            EmailMessage inbox = EmailMessage.builder()
                    .account(recipient)
                    .fromAddress(sender.getAddress())
                    .toAddress(req.getToAddress())
                    .subject(req.getSubject())
                    .body(req.getBody())
                    .folder(EmailFolder.INBOX)
                    .isRead(false)
                    .build();
            messageRepo.save(inbox);
            log.info("Internal email delivered to {}", recipient.getAddress());
        });

        logService.log(username, "Email", "De " + sender.getAddress() + " vers " + req.getToAddress(), null);
        return saved;
    }

    @Transactional
    public EmailMessage markRead(Long messageId) {
        EmailMessage msg = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));
        msg.setRead(true);
        return messageRepo.save(msg);
    }

    @Transactional
    public EmailMessage moveToTrash(Long messageId, String username) {
        EmailMessage msg = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));
        msg.setFolder(EmailFolder.TRASH);
        EmailMessage saved = messageRepo.save(msg);
        logService.log(username, "Email", "Message déplacé dans la corbeille: " + messageId, null);
        return saved;
    }

    @Transactional
    public void deleteMessage(Long messageId, String username) {
        EmailMessage msg = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));
        msg.setFolder(EmailFolder.TRASH);
        messageRepo.save(msg);
        logService.log(username, "Email", "Message déplacé dans la corbeille: " + messageId, null);
    }
}
