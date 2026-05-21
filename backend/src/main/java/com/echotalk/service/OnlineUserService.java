package com.echotalk.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnlineUserService {

    private final StringRedisTemplate redisTemplate;
    private static final String ONLINE_USERS_KEY = "online:users";

    public void addOnlineUser(String userId) {
        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userId);
    }

    public void removeOnlineUser(String userId) {
        redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);
    }

    public long getOnlineCount() {
        Long count = redisTemplate.opsForSet().size(ONLINE_USERS_KEY);
        return count != null ? count : 0;
    }
}
