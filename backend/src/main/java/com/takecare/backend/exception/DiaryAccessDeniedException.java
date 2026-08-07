package com.takecare.backend.exception;

public class DiaryAccessDeniedException extends RuntimeException {

    public DiaryAccessDeniedException() {
        super("You do not have permission to access this diary.");
    }
}