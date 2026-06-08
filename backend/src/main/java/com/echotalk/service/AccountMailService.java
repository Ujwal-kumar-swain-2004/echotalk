package com.echotalk.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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
        send(email, "Verify your EchoTalk email",
                "Verify your email: " + frontendUrl + "/verify-email?token=" + token);
    }

    public void sendPasswordReset(String email, String token) {
        send(email, "Reset your EchoTalk password",
                "Reset your password: " + frontendUrl + "/reset-password?token=" + token);
    }

    private void send(String recipient, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception exception) {
            log.warn("Email delivery unavailable. Development link: {}", body);
        }
    }
}
