package com.echotalk.service;

import com.echotalk.exception.DuplicateUsernameException;
import com.echotalk.exception.DuplicateEmailException;
import com.echotalk.exception.InvalidCredentialsException;
import com.echotalk.exception.UserBannedException;
import com.echotalk.dto.AuthDto;
import com.echotalk.entity.Interest;
import com.echotalk.entity.User;
import com.echotalk.repository.InterestRepository;
import com.echotalk.repository.AccountTokenRepository;
import com.echotalk.entity.AccountToken;
import com.echotalk.repository.UserRepository;
import com.echotalk.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final InterestRepository interestRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AccountTokenRepository accountTokenRepository;
    private final AccountMailService accountMailService;

    @Transactional
    public AuthDto.AuthResponse registerUser(AuthDto.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUsernameException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .gender(request.getGender() != null ? request.getGender() : "UNSPECIFIED")
                .role(User.Role.USER)
                .build();

        user = userRepository.save(user);
        issueToken(user, AccountToken.Type.EMAIL_VERIFICATION);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return response(user, token);
    }

    public AuthDto.AuthResponse loginUser(AuthDto.LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        if (user.isBanned()) {
            throw new UserBannedException("Account is banned");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return response(user, token);
    }

    @Transactional
    public AuthDto.AuthResponse createGuest(AuthDto.GuestRequest request) {
        String guestName = "Guest_" + UUID.randomUUID().toString().substring(0, 8);

        User guest = User.builder()
                .username(guestName)
                .gender(request != null && request.getGender() != null ? request.getGender() : "UNSPECIFIED")
                .role(User.Role.GUEST)
                .emailVerified(true)
                .build();

        if (request != null && request.getInterests() != null) {
            Set<Interest> interests = new HashSet<>();
            for (String tag : request.getInterests()) {
                Interest interest = interestRepository.findByName(tag.toLowerCase())
                        .orElseGet(() -> interestRepository.save(Interest.builder().name(tag.toLowerCase()).build()));
                interests.add(interest);
            }
            guest.setInterests(interests);
        }

        guest = userRepository.save(guest);
        String token = jwtTokenProvider.generateToken(guest.getId(), guest.getUsername(), guest.getRole().name());
        return response(guest, token);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        AccountToken token = requireToken(rawToken, AccountToken.Type.EMAIL_VERIFICATION);
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEmailVerified(true);
        token.setUsedAt(java.time.Instant.now());
        userRepository.save(user);
        accountTokenRepository.save(token);
    }

    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmail(email).filter(user -> !user.isEmailVerified())
                .ifPresent(user -> issueToken(user, AccountToken.Type.EMAIL_VERIFICATION));
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email)
                .ifPresent(user -> issueToken(user, AccountToken.Type.PASSWORD_RESET));
    }

    @Transactional
    public void resetPassword(String rawToken, String password) {
        AccountToken token = requireToken(rawToken, AccountToken.Type.PASSWORD_RESET);
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(password));
        token.setUsedAt(java.time.Instant.now());
        userRepository.save(user);
        accountTokenRepository.save(token);
    }

    private void issueToken(User user, AccountToken.Type type) {
        accountTokenRepository.deleteByUserIdAndType(user.getId(), type);
        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
        AccountToken token = accountTokenRepository.save(AccountToken.builder()
                .userId(user.getId())
                .token(rawToken)
                .type(type)
                .expiresAt(java.time.Instant.now().plus(
                        type == AccountToken.Type.EMAIL_VERIFICATION ? 24 : 1,
                        java.time.temporal.ChronoUnit.HOURS))
                .build());
        if (type == AccountToken.Type.EMAIL_VERIFICATION) {
            accountMailService.sendVerification(user.getEmail(), token.getToken());
        } else {
            accountMailService.sendPasswordReset(user.getEmail(), token.getToken());
        }
    }

    private AccountToken requireToken(String rawToken, AccountToken.Type type) {
        AccountToken token = accountTokenRepository.findByTokenAndType(rawToken, type)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(java.time.Instant.now())) {
            throw new IllegalArgumentException("Token is expired or already used");
        }
        return token;
    }

    private AuthDto.AuthResponse response(User user, String token) {
        return new AuthDto.AuthResponse(
                token,
                user.getId().toString(),
                user.getUsername(),
                user.getRole().name(),
                user.isEmailVerified()
        );
    }
}
