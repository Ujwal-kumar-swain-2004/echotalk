package com.echotalk.service;

import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountMailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private AccountMailService accountMailService;

    @BeforeEach
    void setUp() {
        accountMailService = new AccountMailService(mailSender);
        ReflectionTestUtils.setField(accountMailService, "frontendUrl", "http://localhost:5180");
        ReflectionTestUtils.setField(accountMailService, "from", "no-reply@echotalk.local");
    }

    @Test
    void sendsPasswordResetAsMultipartHtmlEmail() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        accountMailService.sendPasswordReset("user@example.com", "reset-token");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        MimeMessage sent = captor.getValue();
        sent.saveChanges();
        assertEquals("Reset your EchoTalk password", sent.getSubject());
        assertEquals("user@example.com", sent.getRecipients(Message.RecipientType.TO)[0].toString());
        assertTrue(findHtmlBody((Multipart) sent.getContent())
                .contains("http://localhost:5180/reset-password?token=reset-token"));
    }

    private String findHtmlBody(Multipart multipart) throws Exception {
        for (int index = 0; index < multipart.getCount(); index++) {
            BodyPart part = multipart.getBodyPart(index);
            if (part.isMimeType("text/html")) {
                return part.getContent().toString();
            }
            if (part.getContent() instanceof Multipart nested) {
                String html = findHtmlBody(nested);
                if (!html.isEmpty()) {
                    return html;
                }
            }
        }
        return "";
    }
}
