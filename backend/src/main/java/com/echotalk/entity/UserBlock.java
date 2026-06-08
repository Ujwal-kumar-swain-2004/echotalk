package com.echotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "user_blocks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_block_pair",
                columnNames = {"blockerId", "blockedId"}
        ),
        indexes = {
                @Index(name = "idx_user_block_blocker", columnList = "blockerId"),
                @Index(name = "idx_user_block_blocked", columnList = "blockedId")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID blockerId;

    @Column(nullable = false)
    private UUID blockedId;

    @CreationTimestamp
    private Instant createdAt;
}
