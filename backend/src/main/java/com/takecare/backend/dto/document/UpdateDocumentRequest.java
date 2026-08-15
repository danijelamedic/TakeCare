package com.takecare.backend.dto.document;

import com.takecare.backend.model.enums.DocumentType;
import com.takecare.backend.model.enums.DocumentVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateDocumentRequest {

    @NotBlank(message = "Title is required.")
    @Size(max = 200, message = "Title must not exceed 200 characters.")
    private String title;

    @NotNull(message = "Document type is required.")
    private DocumentType documentType;

    @Size(max = 2000, message = "Description must not exceed 2000 characters.")
    private String description;

    private LocalDate documentDate;

    private DocumentVisibility visibility;

    @Positive(message = "Issued by ID must be positive.")
    private Long issuedById;
}