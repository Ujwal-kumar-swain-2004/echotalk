package com.echotalk.service;

import com.echotalk.entity.UserBlock;
import com.echotalk.repository.UserBlockRepository;
import com.echotalk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;

    @Transactional
    public UserBlock block(String blockerId, String blockedId) {
        UUID blocker = UUID.fromString(blockerId);
        UUID blocked = UUID.fromString(blockedId);
        if (blocker.equals(blocked)) {
            throw new IllegalArgumentException("You cannot block yourself");
        }
        if (!userRepository.existsById(blocked)) {
            throw new IllegalArgumentException("User not found");
        }
        return userBlockRepository.findByBlockerIdAndBlockedId(blocker, blocked)
                .orElseGet(() -> userBlockRepository.save(
                        UserBlock.builder().blockerId(blocker).blockedId(blocked).build()
                ));
    }

    @Transactional
    public void unblock(String blockerId, String blockedId) {
        userBlockRepository.findByBlockerIdAndBlockedId(
                UUID.fromString(blockerId),
                UUID.fromString(blockedId)
        ).ifPresent(userBlockRepository::delete);
    }

    public boolean isBlockedEitherWay(String firstId, String secondId) {
        UUID first = UUID.fromString(firstId);
        UUID second = UUID.fromString(secondId);
        return userBlockRepository.existsByBlockerIdAndBlockedId(first, second)
                || userBlockRepository.existsByBlockerIdAndBlockedId(second, first);
    }

    public List<UserBlock> getBlocks(String blockerId) {
        return userBlockRepository.findByBlockerIdOrderByCreatedAtDesc(UUID.fromString(blockerId));
    }
}
