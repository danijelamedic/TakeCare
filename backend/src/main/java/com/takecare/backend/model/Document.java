package com.takecare.backend.model;

import com.takecare.backend.model.enums.DocumentType;
import com.takecare.backend.model.enums.DocumentVisibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DocumentType documentType;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate documentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DocumentVisibility visibility;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "patient_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_document_patient")
    )
    private Patient patient;

    @ManyToOne
    @JoinColumn(
            name = "issued_by_id",
            foreignKey = @ForeignKey(
                    name = "fk_document_issued_by"
            )
    )
    private ProfessionalContact issuedBy;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "uploaded_by_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_document_uploaded_by")
    )
    private User uploadedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        uploadedAt = now;
        updatedAt = now;

        if (visibility == null) {
            visibility = DocumentVisibility.SHARED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}