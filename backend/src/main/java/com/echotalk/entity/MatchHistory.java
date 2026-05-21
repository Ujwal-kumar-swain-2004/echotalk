package com.echotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "match_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID user1Id;

    @Column(nullable = false)
    private UUID user2Id;

    @CreationTimestamp
    private Instant matchedAt;

    @Builder.Default
    private int durationSeconds = 0;
}
