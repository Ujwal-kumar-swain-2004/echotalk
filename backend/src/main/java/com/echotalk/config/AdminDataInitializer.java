package com.echotalk.config;

import com.echotalk.entity.User;
import com.echotalk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.email:admin@echotalk.local}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        userRepository.findByUsername(adminUsername).ifPresentOrElse(
                existingUser -> {
                    if (existingUser.getRole() != User.Role.ADMIN) {
                        existingUser.setRole(User.Role.ADMIN);
                        existingUser.setBanned(false);
                        userRepository.save(existingUser);
                        log.info("Promoted existing user '{}' to ADMIN", adminUsername);
                    }
                },
                () -> {
                    User admin = User.builder()
                            .username(adminUsername)
                            .email(adminEmail)
                            .passwordHash(passwordEncoder.encode(adminPassword))
                            .gender("UNSPECIFIED")
                            .role(User.Role.ADMIN)
                            .banned(false)
                            .build();

                    userRepository.save(admin);
                    log.info("Created default admin user '{}'. Change app.admin.password for non-local use.", adminUsername);
                }
        );
    }
}
