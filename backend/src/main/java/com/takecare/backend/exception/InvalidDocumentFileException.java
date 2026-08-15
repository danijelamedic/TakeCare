package com.takecare.backend.exception;

public class InvalidDocumentFileException extends RuntimeException {

    public InvalidDocumentFileException(String message) {
        super(message);
    }
}