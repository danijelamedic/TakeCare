package com.takecare.backend.dto.document;

import com.takecare.backend.model.enums.DocumentType;
import com.takecare.backend.model.enums.DocumentVisibility;
import com.takecare.backend.model.enums.ProfessionalType;
import com.takecare.backend.model.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class DocumentResponse {

    private Long id;

    private Long patientId;

    private String title;

    private DocumentType documentType;

    private String originalFileName;

    private String contentType;

    private Long fileSize;

    private String description;

    private LocalDate documentDate;

    private Long issuedById;

    private String issuedByName;

    private ProfessionalType issuedByProfessionalType;

    private DocumentVisibility visibility;

    private Long uploadedById;

    private String uploadedByName;

    private Role uploadedByRole;

    private LocalDateTime uploadedAt;

    private LocalDateTime updatedAt;
}