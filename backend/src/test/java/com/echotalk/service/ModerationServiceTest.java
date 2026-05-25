package com.echotalk.service;

import com.echotalk.entity.Ban;
import com.echotalk.entity.Report;
import com.echotalk.entity.User;
import com.echotalk.exception.BanNotFoundException;
import com.echotalk.exception.ReportNotFoundException;
import com.echotalk.exception.UserNotFoundException;
import com.echotalk.repository.BanRepository;
import com.echotalk.repository.ReportRepository;
import com.echotalk.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ModerationServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private BanRepository banRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ModerationService moderationService;

    private User testUser;
    private Report testReport;
    private Ban testBan;
    private UUID userId;
    private UUID reportId;
    private UUID banId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        reportId = UUID.randomUUID();
        banId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .username("testuser")
                .isBanned(false)
                .build();

        testReport = Report.builder()
                .id(reportId)
                .reporterId(UUID.randomUUID())
                .reportedId(userId)
                .reason("spam")
                .status(Report.Status.PENDING)
                .build();

        testBan = Ban.builder()
                .id(banId)
                .userId(userId)
                .reason("spamming")
                .build();
    }

    @Test
    void createReport_Success() {
        when(reportRepository.save(any(Report.class))).thenReturn(testReport);

        Report report = moderationService.createReport(UUID.randomUUID().toString(), userId.toString(), null, "spam");

        assertNotNull(report);
        assertEquals(Report.Status.PENDING, report.getStatus());
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void getReports_ReturnsPage() {
        when(reportRepository.findByStatusOrderByCreatedAtDesc(eq(Report.Status.PENDING), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(testReport)));

        Page<Report> reports = moderationService.getReports("PENDING", 0, 10);

        assertNotNull(reports);
        assertEquals(1, reports.getTotalElements());
    }

    @Test
    void updateReportStatus_Success() {
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(Report.class))).thenReturn(testReport);

        Report updated = moderationService.updateReportStatus(reportId.toString(), "RESOLVED");

        assertEquals(Report.Status.RESOLVED, updated.getStatus());
        verify(reportRepository).save(testReport);
    }

    @Test
    void updateReportStatus_ReportNotFound_ThrowsException() {
        when(reportRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(ReportNotFoundException.class, () -> moderationService.updateReportStatus(UUID.randomUUID().toString(), "RESOLVED"));
    }

    @Test
    void banUser_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(banRepository.save(any(Ban.class))).thenReturn(testBan);

        Ban ban = moderationService.banUser(userId.toString(), "spamming", null, 24L);

        assertNotNull(ban);
        assertTrue(testUser.isBanned());
        verify(userRepository).save(testUser);
        verify(banRepository).save(any(Ban.class));
    }

    @Test
    void banUser_UserNotFound_ThrowsException() {
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> moderationService.banUser(UUID.randomUUID().toString(), "spam", null, 24L));
    }

    @Test
    void unbanUser_Success() {
        testUser.setBanned(true);
        when(banRepository.findById(banId)).thenReturn(Optional.of(testBan));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        moderationService.unbanUser(banId.toString());

        assertFalse(testUser.isBanned());
        verify(userRepository).save(testUser);
        verify(banRepository).delete(testBan);
    }

    @Test
    void isUserBanned_ReturnsTrue() {
        testUser.setBanned(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        boolean isBanned = moderationService.isUserBanned(userId.toString());

        assertTrue(isBanned);
    }
}
