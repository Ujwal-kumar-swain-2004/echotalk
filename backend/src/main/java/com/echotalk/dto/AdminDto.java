package com.echotalk.dto;

import lombok.Data;
import java.util.List;

public class AdminDto {

    @Data
    public static class BanRequest {
        private String userId;
        private String reason;
        private Long durationHours; // null = permanent
    }

    @Data
    public static class ReportUpdateRequest {
        private String status; // REVIEWED, DISMISSED
    }

    @Data
    public static class StatsResponse {
        private long onlineUsers;
        private long totalUsers;
        private long activeChats;
        private long pendingReports;
        private long totalMatches;

        public StatsResponse(long onlineUsers, long totalUsers, long activeChats, long pendingReports, long totalMatches) {
            this.onlineUsers = onlineUsers;
            this.totalUsers = totalUsers;
            this.activeChats = activeChats;
            this.pendingReports = pendingReports;
            this.totalMatches = totalMatches;
        }
    }

    @Data
    public static class UserResponse {
        private String id;
        private String username;
        private String email;
        private String gender;
        private String role;
        private boolean banned;
        private String createdAt;
        private List<String> interests;
    }
}
