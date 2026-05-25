package com.echotalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_report_status_created", columnList = "status, createdAt"),
        @Index(name = "idx_report_reported_id", columnList = "reportedId"),
        @Index(name = "idx_report_reporter_id", columnList = "reporterId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID reporterId;

    @Column(nullable = false)
    private UUID reportedId;

    private UUID chatRoomId;

    @Column(nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @CreationTimestamp
    private Instant createdAt;

    public enum Status {
        PENDING, REVIEWED, DISMISSED
    }
}
