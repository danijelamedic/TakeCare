package com.takecare.backend.exception;

public class DiaryEntryNotFoundException extends RuntimeException {

    public DiaryEntryNotFoundException(Long id) {
        super("Diary entry with ID " + id + " not found.");
    }
}