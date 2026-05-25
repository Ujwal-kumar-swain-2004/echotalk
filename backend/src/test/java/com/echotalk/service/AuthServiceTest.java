package com.echotalk.service;

import com.echotalk.dto.AuthDto;
import com.echotalk.entity.Interest;
import com.echotalk.entity.User;
import com.echotalk.exception.DuplicateEmailException;
import com.echotalk.exception.DuplicateUsernameException;
import com.echotalk.exception.InvalidCredentialsException;
import com.echotalk.exception.UserBannedException;
import com.echotalk.repository.InterestRepository;
import com.echotalk.repository.UserRepository;
import com.echotalk.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private InterestRepository interestRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private AuthDto.RegisterRequest registerRequest;
    private AuthDto.LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hashedpassword")
                .role(User.Role.USER)
                .isBanned(false)
                .build();

        registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setGender("MALE");

        loginRequest = new AuthDto.LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
    }

    @Test
    void registerUser_Success() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedpassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtTokenProvider.generateToken(any(), anyString(), anyString())).thenReturn("test.jwt.token");

        AuthDto.AuthResponse response = authService.registerUser(registerRequest);

        assertNotNull(response);
        assertEquals("test.jwt.token", response.getToken());
        assertEquals("testuser", response.getUsername());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_DuplicateUsername_ThrowsException() {
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        assertThrows(DuplicateUsernameException.class, () -> authService.registerUser(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authService.registerUser(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginUser_Success() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtTokenProvider.generateToken(any(), anyString(), anyString())).thenReturn("test.jwt.token");

        AuthDto.AuthResponse response = authService.loginUser(loginRequest);

        assertNotNull(response);
        assertEquals("test.jwt.token", response.getToken());
    }

    @Test
    void loginUser_UserNotFound_ThrowsException() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.loginUser(loginRequest));
    }

    @Test
    void loginUser_InvalidPassword_ThrowsException() {
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.loginUser(loginRequest));
    }

    @Test
    void loginUser_UserBanned_ThrowsException() {
        testUser.setBanned(true);
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThrows(UserBannedException.class, () -> authService.loginUser(loginRequest));
    }

    @Test
    void createGuest_Success() {
        AuthDto.GuestRequest guestRequest = new AuthDto.GuestRequest();
        guestRequest.setGender("FEMALE");
        guestRequest.setInterests(List.of("music", "art"));

        User guestUser = User.builder()
                .id(UUID.randomUUID())
                .username("Guest_12345678")
                .role(User.Role.GUEST)
                .build();

        when(interestRepository.findByName(anyString())).thenReturn(Optional.of(Interest.builder().name("music").build()));
        when(userRepository.save(any(User.class))).thenReturn(guestUser);
        when(jwtTokenProvider.generateToken(any(), anyString(), anyString())).thenReturn("guest.jwt.token");

        AuthDto.AuthResponse response = authService.createGuest(guestRequest);

        assertNotNull(response);
        assertEquals("guest.jwt.token", response.getToken());
        verify(userRepository).save(any(User.class));
    }
}
