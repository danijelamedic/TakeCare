package com.takecare.backend.exception;

public class InvalidTherapyDataException extends RuntimeException {

    public InvalidTherapyDataException(String message) {
        super(message);
    }
}