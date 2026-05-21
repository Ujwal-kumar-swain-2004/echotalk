package com.echotalk.service;

import com.echotalk.entity.Ban;
import com.echotalk.entity.Report;
import com.echotalk.entity.User;
import com.echotalk.repository.BanRepository;
import com.echotalk.repository.ReportRepository;
import com.echotalk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModerationService {

    private final ReportRepository reportRepository;
    private final BanRepository banRepository;
    private final UserRepository userRepository;

    @Transactional
    public Report createReport(String reporterId, String reportedId, String chatRoomId, String reason) {
        Report report = Report.builder()
                .reporterId(UUID.fromString(reporterId))
                .reportedId(UUID.fromString(reportedId))
                .chatRoomId(chatRoomId != null ? UUID.fromString(chatRoomId) : null)
                .reason(reason)
                .status(Report.Status.PENDING)
                .build();
        report = reportRepository.save(report);
        log.info("Report created: {} reported {} for '{}'", reporterId, reportedId, reason);
        return report;
    }

    public Page<Report> getReports(String status, int page, int size) {
        if (status != null && !status.isEmpty()) {
            return reportRepository.findByStatusOrderByCreatedAtDesc(
                    Report.Status.valueOf(status.toUpperCase()),
                    PageRequest.of(page, size));
        }
        return reportRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional
    public Report updateReportStatus(String reportId, String status) {
        Report report = reportRepository.findById(UUID.fromString(reportId))
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(Report.Status.valueOf(status.toUpperCase()));
        return reportRepository.save(report);
    }

    @Transactional
    public Ban banUser(String userId, String reason, String bannedById, Long durationHours) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(true);
        userRepository.save(user);

        Ban ban = Ban.builder()
                .userId(UUID.fromString(userId))
                .reason(reason)
                .bannedBy(bannedById != null ? UUID.fromString(bannedById) : null)
                .expiresAt(durationHours != null ? Instant.now().plus(durationHours, ChronoUnit.HOURS) : null)
                .build();
        ban = banRepository.save(ban);
        log.info("User {} banned for '{}' (duration: {} hours)", userId, reason, durationHours);
        return ban;
    }

    @Transactional
    public void unbanUser(String banId) {
        Ban ban = banRepository.findById(UUID.fromString(banId))
                .orElseThrow(() -> new RuntimeException("Ban not found"));
        User user = userRepository.findById(ban.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(false);
        userRepository.save(user);
        banRepository.delete(ban);
        log.info("User {} unbanned", ban.getUserId());
    }

    public boolean isUserBanned(String userId) {
        User user = userRepository.findById(UUID.fromString(userId)).orElse(null);
        return user != null && user.isBanned();
    }

    public long getPendingReportsCount() {
        return reportRepository.countByStatus(Report.Status.PENDING);
    }
}
