package com.olivepro.service;

import com.olivepro.domain.*;
import com.olivepro.dto.request.SendEmailRequest;
import com.olivepro.enums.EmailFolder;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.*;
import com.olivepro.websocket.AlertsBroadcaster;
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
    private final AlertsBroadcaster broadcaster;

    public EmailService(EmailAccountRepository accountRepo, EmailMessageRepository messageRepo,
                        ActivityLogService logService, AlertsBroadcaster broadcaster) {
        this.accountRepo = accountRepo; this.messageRepo = messageRepo;
        this.logService = logService; this.broadcaster = broadcaster;
    }

    public List<EmailAccount> getAccounts() { return accountRepo.findAll(); }

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

        // Save SENT copy for sender
        EmailMessage sent = EmailMessage.builder()
                .account(sender).fromAddress(sender.getAddress())
                .toAddress(req.getToAddress()).subject(req.getSubject())
                .body(req.getBody()).folder(EmailFolder.SENT).isRead(true).build();
        messageRepo.save(sent);

        // If recipient is internal, create INBOX copy
        accountRepo.findByAddress(req.getToAddress()).ifPresent(recipient -> {
            EmailMessage inbox = EmailMessage.builder()
                    .account(recipient).fromAddress(sender.getAddress())
                    .toAddress(req.getToAddress()).subject(req.getSubject())
                    .body(req.getBody()).folder(EmailFolder.INBOX).isRead(false).build();
            messageRepo.save(inbox);
            log.info("Internal email delivered to {}", recipient.getAddress());
        });

        logService.log(username, "Email", "De " + sender.getAddress() + " vers " + req.getToAddress(), null);
        broadcaster.broadcast();
        return sent;
    }

    @Transactional
    public EmailMessage markRead(Long messageId) {
        EmailMessage msg = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));
        msg.setRead(true);
        EmailMessage saved = messageRepo.save(msg);
        broadcaster.broadcast();
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

