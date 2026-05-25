package com.echotalk.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;
    private final int maxRequestsPerMinute;
    private final ObjectMapper objectMapper;

    // In-memory fallback for local development or when Redis is down
    private final ConcurrentHashMap<String, RequestCounter> inMemoryCache = new ConcurrentHashMap<>();

    public RateLimitFilter(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.max-requests-per-minute:60}") int maxRequestsPerMinute,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip rate limiting for static/swagger endpoints if needed, but rate limiting all /api endpoints is good practice.
        String path = request.getRequestURI();
        if (!path.startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        boolean isAllowed = checkRateLimit(ip);
        if (!isAllowed) {
            log.warn("Rate limit exceeded for IP: {}", ip);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            
            Map<String, Object> errorDetails = Map.of(
                    "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                    "error", "Too Many Requests",
                    "message", "Rate limit exceeded. Maximum allowed: " + maxRequestsPerMinute + " requests per minute.",
                    "timestamp", Instant.now().toString()
            );
            
            response.getWriter().write(objectMapper.writeValueAsString(errorDetails));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkRateLimit(String ip) {
        String key = "rate:limit:" + ip;
        try {
            // Increment the count in Redis
            Long count = redisTemplate.opsForValue().increment(key);
            if (count == null) {
                return true;
            }
            if (count == 1) {
                // First request in the current window, set TTL
                redisTemplate.expire(key, 60, TimeUnit.SECONDS);
            }
            return count <= maxRequestsPerMinute;
        } catch (Exception e) {
            log.error("Redis connection error during rate limiting, falling back to in-memory: {}", e.getMessage());
            return checkInMemoryRateLimit(ip);
        }
    }

    private boolean checkInMemoryRateLimit(String ip) {
        Instant now = Instant.now();
        RequestCounter counter = inMemoryCache.compute(ip, (k, v) -> {
            if (v == null || v.isExpired(now)) {
                return new RequestCounter(1, now.plus(Duration.ofMinutes(1)));
            }
            v.increment();
            return v;
        });
        return counter.getCount() <= maxRequestsPerMinute;
    }

    private static class RequestCounter {
        private int count;
        private final Instant resetTime;

        public RequestCounter(int count, Instant resetTime) {
            this.count = count;
            this.resetTime = resetTime;
        }

        public int getCount() {
            return count;
        }

        public void increment() {
            this.count++;
        }

        public boolean isExpired(Instant now) {
            return now.isAfter(resetTime);
        }
    }
}
