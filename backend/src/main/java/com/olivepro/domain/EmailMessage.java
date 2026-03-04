package com.olivepro.domain;

import com.olivepro.enums.EmailFolder;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_messages")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /** The account this message belongs to (inbox owner or sender) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private EmailAccount account;
    @Column(nullable = false)
    private String fromAddress;
    @Column(nullable = false)
    private String toAddress;
    @Column(nullable = false)
    private String subject;
    @Column(length = 5000)
    private String body;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EmailFolder folder = EmailFolder.INBOX;
    @Builder.Default
    private boolean isRead = false;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @PrePersist void prePersist() { this.createdAt = LocalDateTime.now(); }
}

