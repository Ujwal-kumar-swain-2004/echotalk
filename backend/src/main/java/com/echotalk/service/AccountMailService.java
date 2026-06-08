package com.echotalk.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountMailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:no-reply@echotalk.local}")
    private String from;

    public void sendVerification(String email, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        send(email, "Verify your EchoTalk email", emailTemplate(
                "Verify your email",
                "Confirm your email address to finish setting up your EchoTalk account.",
                "Verify email",
                link,
                "This link expires in 24 hours."
        ));
    }

    public void sendPasswordReset(String email, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        send(email, "Reset your EchoTalk password", emailTemplate(
                "Reset your password",
                "We received a request to reset your EchoTalk password.",
                "Choose a new password",
                link,
                "This link expires in 1 hour. Ignore this email if you did not request it."
        ));
    }

    private void send(String recipient, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText("Open this email in an HTML-capable client.", html);
            mailSender.send(message);
            log.info("Sent '{}' email to {}", subject, recipient);
        } catch (Exception exception) {
            log.error("Failed to send '{}' email to {}: {}", subject, recipient, exception.getMessage());
        }
    }

    private String emailTemplate(
            String heading,
            String message,
            String actionLabel,
            String actionUrl,
            String footer
    ) {
        return """
                <!doctype html>
                <html>
                  <body style="margin:0;background:#0b0c10;color:#f3f4f6;font-family:Arial,sans-serif">
                    <div style="max-width:560px;margin:32px auto;padding:32px;background:#151522;border-radius:24px">
                      <div style="font-size:22px;font-weight:700;color:#aa3bff;margin-bottom:28px">EchoTalk</div>
                      <h1 style="font-size:28px;margin:0 0 14px;color:#ffffff">%s</h1>
                      <p style="font-size:16px;line-height:1.6;color:#b7bac5;margin:0 0 28px">%s</p>
                      <a href="%s" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#9333ea;color:#ffffff;text-decoration:none;font-weight:700">%s</a>
                      <p style="font-size:13px;line-height:1.5;color:#737785;margin:28px 0 0">%s</p>
                    </div>
                  </body>
                </html>
                """.formatted(heading, message, actionUrl, actionLabel, footer);
    }
}
