package com.takecare.backend.dto.document;

public record StoredDocumentFile(
        String fileName,
        String filePath,
        String contentType,
        long fileSize
) {
}