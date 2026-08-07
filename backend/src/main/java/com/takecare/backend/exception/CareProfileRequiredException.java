package com.takecare.backend.exception;

public class CareProfileRequiredException extends RuntimeException {
    public CareProfileRequiredException(String message) {
        super(message);
    }
}
