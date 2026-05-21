package com.echotalk.controller;

import com.echotalk.service.OnlineUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final OnlineUserService onlineUserService;

    @GetMapping("/online-count")
    public ResponseEntity<Map<String, Long>> getOnlineCount() {
        return ResponseEntity.ok(Map.of("count", onlineUserService.getOnlineCount()));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "EchoTalk"));
    }
}
