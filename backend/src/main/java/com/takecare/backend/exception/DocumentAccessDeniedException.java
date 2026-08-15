package com.takecare.backend.exception;

public class DocumentAccessDeniedException extends RuntimeException {

    public DocumentAccessDeniedException() {
        super("You do not have permission to access this document.");
    }

    public DocumentAccessDeniedException(String message) {
        super(message);
    }
}