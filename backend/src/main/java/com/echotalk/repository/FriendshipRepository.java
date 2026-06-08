package com.echotalk.repository;

import com.echotalk.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    Optional<Friendship> findByRequesterIdAndAddresseeId(UUID requesterId, UUID addresseeId);
    List<Friendship> findByRequesterIdOrAddresseeIdOrderByCreatedAtDesc(UUID requesterId, UUID addresseeId);
}
