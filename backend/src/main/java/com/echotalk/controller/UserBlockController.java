package com.echotalk.controller;

import com.echotalk.entity.UserBlock;
import com.echotalk.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
public class UserBlockController {

    private final UserBlockService userBlockService;

    @GetMapping
    public List<Map<String, Object>> getBlocks(Authentication auth) {
        return userBlockService.getBlocks(auth.getPrincipal().toString()).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/{blockedId}")
    public Map<String, Object> block(@PathVariable String blockedId, Authentication auth) {
        return toResponse(userBlockService.block(auth.getPrincipal().toString(), blockedId));
    }

    @DeleteMapping("/{blockedId}")
    public ResponseEntity<Void> unblock(@PathVariable String blockedId, Authentication auth) {
        userBlockService.unblock(auth.getPrincipal().toString(), blockedId);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toResponse(UserBlock block) {
        return Map.of(
                "id", block.getId(),
                "blockedId", block.getBlockedId(),
                "createdAt", block.getCreatedAt()
        );
    }
}
