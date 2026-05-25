package com.echotalk.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchmakingService {

    private final StringRedisTemplate redisTemplate;

    private static final String QUEUE_PREFIX = "matchmaking:queue:";
    private static final String USER_GENDER_KEY = "matchmaking:user:gender:";
    private static final String USER_INTERESTS_KEY = "matchmaking:user:interests:";
    private static final String ACTIVE_MATCH_KEY = "matchmaking:active:";

    // TTL constants to prevent stale data accumulation
    private static final Duration QUEUE_METADATA_TTL = Duration.ofMinutes(10);
    private static final Duration ACTIVE_MATCH_TTL = Duration.ofHours(2);

    /**
     * Add user to matchmaking queue with gender preference
     */
    public void addToQueue(String userId, String gender, String preferredGender, List<String> interests) {
        // Store user metadata with TTL
        redisTemplate.opsForValue().set(USER_GENDER_KEY + userId, gender, QUEUE_METADATA_TTL);
        if (interests != null && !interests.isEmpty()) {
            String interestsKey = USER_INTERESTS_KEY + userId;
            redisTemplate.opsForSet().add(interestsKey, interests.toArray(new String[0]));
            redisTemplate.expire(interestsKey, QUEUE_METADATA_TTL);
        }

        // Add to queue based on gender
        String queueKey = QUEUE_PREFIX + gender.toLowerCase();
        redisTemplate.opsForList().rightPush(queueKey, userId);

        // Also add to general queue
        redisTemplate.opsForList().rightPush(QUEUE_PREFIX + "all", userId);

        log.info("User {} added to matchmaking queue (gender: {}, preferred: {})", userId, gender, preferredGender);
    }

    /**
     * Try to find a match for a user
     * Returns matched userId or null
     */
    public String findMatch(String userId, String preferredGender) {
        String queueKey;

        if (preferredGender != null && !preferredGender.equalsIgnoreCase("RANDOM")) {
            // Look in preferred gender queue first
            queueKey = QUEUE_PREFIX + preferredGender.toLowerCase();
            String match = tryMatchFromQueue(userId, queueKey);
            if (match != null) return match;
        }

        // Fallback to general queue
        queueKey = QUEUE_PREFIX + "all";
        return tryMatchFromQueue(userId, queueKey);
    }

    private String tryMatchFromQueue(String userId, String queueKey) {
        Long size = redisTemplate.opsForList().size(queueKey);
        if (size == null || size == 0) return null;

        // Iterate queue to find a valid match (not self, not already matched)
        for (int i = 0; i < size; i++) {
            String candidateId = redisTemplate.opsForList().index(queueKey, i);
            if (candidateId != null && !candidateId.equals(userId) && !isInActiveMatch(candidateId)) {
                // Remove matched user from all queues
                removeFromAllQueues(candidateId);
                removeFromAllQueues(userId);

                // Mark both as active match
                setActiveMatch(userId, candidateId);
                setActiveMatch(candidateId, userId);

                log.info("Match found: {} <-> {}", userId, candidateId);
                return candidateId;
            }
        }
        return null;
    }

    /**
     * Remove user from all queues
     */
    public void removeFromAllQueues(String userId) {
        for (String gender : List.of("male", "female", "unspecified", "all")) {
            redisTemplate.opsForList().remove(QUEUE_PREFIX + gender, 0, userId);
        }
        // Clean up metadata
        redisTemplate.delete(USER_GENDER_KEY + userId);
        redisTemplate.delete(USER_INTERESTS_KEY + userId);
    }

    /**
     * Set active match between two users with TTL to prevent ghost matches
     */
    public void setActiveMatch(String userId, String partnerId) {
        redisTemplate.opsForValue().set(ACTIVE_MATCH_KEY + userId, partnerId, ACTIVE_MATCH_TTL);
    }

    /**
     * Get active match partner
     */
    public String getActiveMatch(String userId) {
        return redisTemplate.opsForValue().get(ACTIVE_MATCH_KEY + userId);
    }

    /**
     * Check if user is in an active match
     */
    public boolean isInActiveMatch(String userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(ACTIVE_MATCH_KEY + userId));
    }

    /**
     * Clear active match for a user
     */
    public void clearActiveMatch(String userId) {
        String partnerId = redisTemplate.opsForValue().get(ACTIVE_MATCH_KEY + userId);
        redisTemplate.delete(ACTIVE_MATCH_KEY + userId);
        if (partnerId != null) {
            redisTemplate.delete(ACTIVE_MATCH_KEY + partnerId);
        }
    }

    /**
     * Get total users in queue
     */
    public long getQueueSize() {
        Long size = redisTemplate.opsForList().size(QUEUE_PREFIX + "all");
        return size != null ? size : 0;
    }
}
