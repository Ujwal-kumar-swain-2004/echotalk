package com.echotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ban {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String reason;

    private UUID bannedBy;

    @CreationTimestamp
    private Instant bannedAt;

    private Instant expiresAt;

    public boolean isActive() {
        return expiresAt == null || expiresAt.isAfter(Instant.now());
    }
}
