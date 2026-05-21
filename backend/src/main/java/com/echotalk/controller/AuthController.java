package com.echotalk.controller;

import com.echotalk.dto.AuthDto;
import com.echotalk.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(authService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.loginUser(request));
    }

    @PostMapping("/guest")
    public ResponseEntity<AuthDto.AuthResponse> guest(@RequestBody(required = false) AuthDto.GuestRequest request) {
        return ResponseEntity.ok(authService.createGuest(request != null ? request : new AuthDto.GuestRequest()));
    }
}
