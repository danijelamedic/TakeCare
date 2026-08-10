package com.takecare.backend.exception;

public class TherapyIntakeNotFoundException extends RuntimeException {

    public TherapyIntakeNotFoundException(Long intakeId) {
        super("Therapy intake with ID " + intakeId + " not found.");
    }
}