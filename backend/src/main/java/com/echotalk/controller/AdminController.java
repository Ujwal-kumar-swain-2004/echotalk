package com.echotalk.controller;

import com.echotalk.dto.AdminDto;
import com.echotalk.entity.Ban;
import com.echotalk.entity.Report;
import com.echotalk.entity.User;
import com.echotalk.repository.MatchHistoryRepository;
import com.echotalk.repository.UserRepository;
import com.echotalk.service.ChatService;
import com.echotalk.service.ModerationService;
import com.echotalk.service.OnlineUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ModerationService moderationService;
    private final OnlineUserService onlineUserService;
    private final ChatService chatService;
    private final UserRepository userRepository;
    private final MatchHistoryRepository matchHistoryRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminDto.StatsResponse> getStats() {
        AdminDto.StatsResponse stats = new AdminDto.StatsResponse(
                onlineUserService.getOnlineCount(),
                userRepository.count(),
                chatService.getActiveChatsCount(),
                moderationService.getPendingReportsCount(),
                matchHistoryRepository.count()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/reports")
    public ResponseEntity<Page<Report>> getReports(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(moderationService.getReports(status, page, size));
    }

    @PutMapping("/reports/{id}")
    public ResponseEntity<Report> updateReport(
            @PathVariable String id,
            @RequestBody AdminDto.ReportUpdateRequest request) {
        return ResponseEntity.ok(moderationService.updateReportStatus(id, request.getStatus()));
    }

    @PostMapping("/bans")
    public ResponseEntity<Ban> banUser(
            @RequestBody AdminDto.BanRequest request,
            Authentication auth) {
        String adminId = auth.getPrincipal().toString();
        Ban ban = moderationService.banUser(request.getUserId(), request.getReason(), adminId, request.getDurationHours());
        return ResponseEntity.ok(ban);
    }

    @DeleteMapping("/bans/{id}")
    public ResponseEntity<Map<String, String>> unbanUser(@PathVariable String id) {
        moderationService.unbanUser(id);
        return ResponseEntity.ok(Map.of("message", "User unbanned successfully"));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
