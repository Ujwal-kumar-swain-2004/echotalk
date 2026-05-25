package com.echotalk.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchmakingServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private ListOperations<String, String> listOperations;

    @Mock
    private SetOperations<String, String> setOperations;

    @InjectMocks
    private MatchmakingService matchmakingService;

    @BeforeEach
    void setUp() {
        // We leniently mock opsForValue, opsForList, opsForSet to return our mocked operations
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(redisTemplate.opsForList()).thenReturn(listOperations);
        lenient().when(redisTemplate.opsForSet()).thenReturn(setOperations);
    }

    @Test
    void addToQueue_Success() {
        String userId = "user1";
        String gender = "MALE";
        String preferredGender = "FEMALE";
        List<String> interests = List.of("gaming");

        matchmakingService.addToQueue(userId, gender, preferredGender, interests);

        verify(valueOperations).set("matchmaking:user:gender:user1", "MALE");
        verify(setOperations).add(eq("matchmaking:user:interests:user1"), any(String[].class));
        verify(listOperations).rightPush("matchmaking:queue:male", "user1");
        verify(listOperations).rightPush("matchmaking:queue:all", "user1");
    }

    @Test
    void findMatch_InPreferredQueue_Success() {
        String userId = "user1";
        String preferredGender = "FEMALE";
        String candidateId = "user2";

        // Mock queue size
        when(listOperations.size("matchmaking:queue:female")).thenReturn(1L);
        // Mock queue item
        when(listOperations.index("matchmaking:queue:female", 0)).thenReturn(candidateId);
        // Candidate not in active match
        when(redisTemplate.hasKey("matchmaking:active:" + candidateId)).thenReturn(false);

        String match = matchmakingService.findMatch(userId, preferredGender);

        assertEquals(candidateId, match);
        // Verify both were removed from queues and active match was set
        verify(listOperations, atLeastOnce()).remove(anyString(), eq(0L), eq(candidateId));
        verify(listOperations, atLeastOnce()).remove(anyString(), eq(0L), eq(userId));
        verify(valueOperations).set("matchmaking:active:" + userId, candidateId);
        verify(valueOperations).set("matchmaking:active:" + candidateId, userId);
    }

    @Test
    void findMatch_InGeneralQueue_Success() {
        String userId = "user1";
        String preferredGender = "RANDOM"; // should fallback to 'all' queue
        String candidateId = "user2";

        when(listOperations.size("matchmaking:queue:all")).thenReturn(1L);
        when(listOperations.index("matchmaking:queue:all", 0)).thenReturn(candidateId);
        when(redisTemplate.hasKey("matchmaking:active:" + candidateId)).thenReturn(false);

        String match = matchmakingService.findMatch(userId, preferredGender);

        assertEquals(candidateId, match);
    }

    @Test
    void findMatch_QueueEmpty_ReturnsNull() {
        when(listOperations.size("matchmaking:queue:female")).thenReturn(0L);
        when(listOperations.size("matchmaking:queue:all")).thenReturn(0L);

        String match = matchmakingService.findMatch("user1", "FEMALE");

        assertNull(match);
    }

    @Test
    void removeFromAllQueues_Success() {
        matchmakingService.removeFromAllQueues("user1");

        verify(listOperations).remove("matchmaking:queue:male", 0, "user1");
        verify(listOperations).remove("matchmaking:queue:female", 0, "user1");
        verify(listOperations).remove("matchmaking:queue:unspecified", 0, "user1");
        verify(listOperations).remove("matchmaking:queue:all", 0, "user1");
        verify(redisTemplate).delete("matchmaking:user:gender:user1");
        verify(redisTemplate).delete("matchmaking:user:interests:user1");
    }

    @Test
    void clearActiveMatch_Success() {
        String userId = "user1";
        String partnerId = "user2";
        when(valueOperations.get("matchmaking:active:" + userId)).thenReturn(partnerId);

        matchmakingService.clearActiveMatch(userId);

        verify(redisTemplate).delete("matchmaking:active:" + userId);
        verify(redisTemplate).delete("matchmaking:active:" + partnerId);
    }
}
