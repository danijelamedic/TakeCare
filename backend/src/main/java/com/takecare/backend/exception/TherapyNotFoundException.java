package com.takecare.backend.exception;

public class TherapyNotFoundException extends RuntimeException {

    public TherapyNotFoundException(Long therapyId) {
        super("Therapy with ID " + therapyId + " not found.");
    }
}