package com.takecare.backend.exception;

public class TherapyAccessDeniedException extends RuntimeException {

    public TherapyAccessDeniedException() {
        super("You do not have permission to access this therapy.");
    }
}