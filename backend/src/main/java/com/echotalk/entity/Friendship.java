package com.echotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "friendships", uniqueConstraints = @UniqueConstraint(
        name = "uk_friendship_pair", columnNames = {"requesterId", "addresseeId"}
))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Friendship {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false)
    private UUID requesterId;
    @Column(nullable = false)
    private UUID addresseeId;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;
    @CreationTimestamp
    private Instant createdAt;

    public enum Status { PENDING, ACCEPTED, DECLINED }
}
