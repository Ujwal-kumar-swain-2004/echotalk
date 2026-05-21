package com.echotalk.repository;

import com.echotalk.entity.Ban;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BanRepository extends JpaRepository<Ban, UUID> {
    List<Ban> findByUserIdOrderByBannedAtDesc(UUID userId);
    boolean existsByUserIdAndExpiresAtIsNullOrUserIdAndExpiresAtAfter(UUID uid1, UUID uid2, java.time.Instant now);
}
