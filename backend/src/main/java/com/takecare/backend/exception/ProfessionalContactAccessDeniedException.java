package com.takecare.backend.exception;

public class ProfessionalContactAccessDeniedException
        extends RuntimeException {

    public ProfessionalContactAccessDeniedException(String message) {
        super(message);
    }
}