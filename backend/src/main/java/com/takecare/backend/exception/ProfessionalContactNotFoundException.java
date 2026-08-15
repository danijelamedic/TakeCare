package com.takecare.backend.exception;

public class ProfessionalContactNotFoundException extends RuntimeException {

    public ProfessionalContactNotFoundException(Long contactId) {
        super(
                "Professional contact with ID "
                        + contactId
                        + " not found."
        );
    }
}