package com.echotalk.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class LoginRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 30)
        private String username;
        @Email @NotBlank
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
        private String gender;
    }

    @Data
    public static class GuestRequest {
        private String gender;
        private java.util.List<String> interests;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String userId;
        private String username;
        private String role;

        public AuthResponse(String token, String userId, String username, String role) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.role = role;
        }
    }
}
