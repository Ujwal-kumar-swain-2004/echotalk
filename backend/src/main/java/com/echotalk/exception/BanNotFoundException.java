package com.echotalk.exception;

public class BanNotFoundException extends RuntimeException {
    public BanNotFoundException(String message) {
        super(message);
    }
}
