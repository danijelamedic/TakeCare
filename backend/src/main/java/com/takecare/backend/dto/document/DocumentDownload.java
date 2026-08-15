package com.takecare.backend.dto.document;

import org.springframework.core.io.Resource;

public record DocumentDownload(
        Resource resource,
        String originalFileName,
        String contentType
) {
}