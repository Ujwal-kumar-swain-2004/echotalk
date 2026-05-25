package com.echotalk.exception;

public record ErrorResponse(
        int status,
        String error,
        String message,
        String timestamp
) {}
