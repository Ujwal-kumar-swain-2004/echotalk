package com.echotalk.repository;

import com.echotalk.entity.MatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface MatchHistoryRepository extends JpaRepository<MatchHistory, UUID> {
    long count();
}
