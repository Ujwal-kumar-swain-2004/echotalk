package com.echotalk.service;

import com.echotalk.exception.DuplicateUsernameException;
import com.echotalk.exception.DuplicateEmailException;
import com.echotalk.exception.InvalidCredentialsException;
import com.echotalk.exception.UserBannedException;
import com.echotalk.dto.AuthDto;
import com.echotalk.entity.Interest;
import com.echotalk.entity.User;
import com.echotalk.repository.InterestRepository;
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
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return new AuthDto.AuthResponse(token, user.getId().toString(), user.getUsername(), user.getRole().name());
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
        return new AuthDto.AuthResponse(token, user.getId().toString(), user.getUsername(), user.getRole().name());
    }

    @Transactional
    public AuthDto.AuthResponse createGuest(AuthDto.GuestRequest request) {
        String guestName = "Guest_" + UUID.randomUUID().toString().substring(0, 8);

        User guest = User.builder()
                .username(guestName)
                .gender(request != null && request.getGender() != null ? request.getGender() : "UNSPECIFIED")
                .role(User.Role.GUEST)
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
        return new AuthDto.AuthResponse(token, guest.getId().toString(), guest.getUsername(), guest.getRole().name());
    }
}
