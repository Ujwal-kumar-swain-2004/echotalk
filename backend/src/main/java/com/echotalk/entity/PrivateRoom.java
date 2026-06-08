package com.echotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "private_rooms", indexes = @Index(name = "idx_private_room_code", columnList = "code", unique = true))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrivateRoom {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true, length = 10)
    private String code;
    @Column(nullable = false)
    private UUID hostId;
    private UUID guestId;
    @Column(nullable = false)
    private Instant expiresAt;
    @CreationTimestamp
    private Instant createdAt;
}
