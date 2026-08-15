package com.takecare.backend.service;

import com.takecare.backend.dto.document.DocumentDownload;
import com.takecare.backend.dto.document.DocumentResponse;
import com.takecare.backend.dto.document.DocumentUploadRequest;
import com.takecare.backend.dto.document.StoredDocumentFile;
import com.takecare.backend.dto.document.UpdateDocumentRequest;
import com.takecare.backend.exception.DocumentAccessDeniedException;
import com.takecare.backend.exception.DocumentNotFoundException;
import com.takecare.backend.exception.PatientNotFoundException;
import com.takecare.backend.model.*;
import com.takecare.backend.model.enums.DocumentVisibility;
import com.takecare.backend.repository.DocumentRepository;
import com.takecare.backend.repository.PatientProfessionalContactRepository;
import com.takecare.backend.repository.PatientRepository;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PatientRepository patientRepository;
    private final PatientProfessionalContactRepository patientProfessionalContactRepository;
    private final UserRepository userRepository;
    private final DocumentStorageService documentStorageService;

    @Transactional
    public DocumentResponse uploadDocument(
            DocumentUploadRequest request
    ) {

        User currentUser = getCurrentUser();

        Patient patient = patientRepository
                .findById(request.getPatientId())
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID "
                                        + request.getPatientId()
                                        + " not found."
                        )
                );

        validatePatientAccess(patient, currentUser);

        ProfessionalContact issuedBy =
                resolveIssuedBy(
                        patient.getId(),
                        request.getIssuedById()
                );

        StoredDocumentFile storedFile =
                documentStorageService.store(request.getFile());

        try {
            Document document = new Document();

            document.setTitle(request.getTitle().trim());
            document.setDocumentType(request.getDocumentType());
            document.setDescription(normalizeOptionalText(
                    request.getDescription()
            ));
            document.setDocumentDate(request.getDocumentDate());

            document.setFileName(storedFile.fileName());
            document.setOriginalFileName(
                    StringUtils.cleanPath(
                            request.getFile().getOriginalFilename()
                    )
            );
            document.setFilePath(storedFile.filePath());
            document.setContentType(storedFile.contentType());
            document.setFileSize(storedFile.fileSize());

            document.setPatient(patient);
            document.setIssuedBy(issuedBy);
            document.setUploadedBy(currentUser);

            if (isCoordinator(patient, currentUser)) {
                document.setVisibility(
                        DocumentVisibility.SHARED
                );
            } else {
                document.setVisibility(
                        request.getVisibility() != null
                                ? request.getVisibility()
                                : DocumentVisibility.SHARED
                );
            }

            Document savedDocument =
                    documentRepository.saveAndFlush(document);

            return mapToResponse(savedDocument);

        } catch (RuntimeException exception) {

            try {
                documentStorageService.delete(
                        storedFile.fileName()
                );
            } catch (RuntimeException ignored) {
                // Preserve the original database error.
            }

            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsForPatient(
            Long patientId
    ) {

        User currentUser = getCurrentUser();

        Patient patient = patientRepository
                .findById(patientId)
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID "
                                        + patientId
                                        + " not found."
                        )
                );

        validatePatientAccess(patient, currentUser);

        List<Document> documents =
                documentRepository
                        .findByPatientIdOrderByUploadedAtDesc(
                                patientId
                        );

        if (isCoordinator(patient, currentUser)) {
            documents = documents.stream()
                    .filter(document ->
                            document.getVisibility()
                                    == DocumentVisibility.SHARED
                                    ||
                                    document.getUploadedBy()
                                            .getId()
                                            .equals(currentUser.getId())
                    )
                    .toList();
        }

        return documents.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(Long documentId) {

        User currentUser = getCurrentUser();

        Document document =
                findAccessibleDocument(
                        documentId,
                        currentUser
                );

        return mapToResponse(document);
    }

    @Transactional
    public DocumentResponse updateDocument(
            Long documentId,
            UpdateDocumentRequest request
    ) {

        User currentUser = getCurrentUser();

        Document document =
                findAccessibleDocument(
                        documentId,
                        currentUser
                );

        validateOwnership(document, currentUser);

        ProfessionalContact issuedBy =
                resolveIssuedBy(
                        document.getPatient().getId(),
                        request.getIssuedById()
                );

        document.setTitle(request.getTitle().trim());
        document.setDocumentType(
                request.getDocumentType()
        );
        document.setDescription(
                normalizeOptionalText(
                        request.getDescription()
                )
        );
        document.setDocumentDate(
                request.getDocumentDate()
        );

        document.setIssuedBy(issuedBy);

        if (isCoordinator(
                document.getPatient(),
                currentUser
        )) {
            document.setVisibility(
                    DocumentVisibility.SHARED
            );
        } else if (request.getVisibility() != null) {
            document.setVisibility(
                    request.getVisibility()
            );
        }

        Document updatedDocument =
                documentRepository.save(document);

        return mapToResponse(updatedDocument);
    }

    @Transactional(readOnly = true)
    public DocumentDownload downloadDocument(
            Long documentId
    ) {

        User currentUser = getCurrentUser();

        Document document =
                findAccessibleDocument(
                        documentId,
                        currentUser
                );

        return new DocumentDownload(
                documentStorageService.load(
                        document.getFileName()
                ),
                document.getOriginalFileName(),
                document.getContentType()
        );
    }

    @Transactional
    public void deleteDocument(Long documentId) {

        User currentUser = getCurrentUser();

        Document document =
                findAccessibleDocument(
                        documentId,
                        currentUser
                );

        validateOwnership(document, currentUser);

        documentStorageService.delete(
                document.getFileName()
        );

        documentRepository.delete(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsForProfessional(
            Long patientId,
            Long professionalId
    ) {

        User currentUser = getCurrentUser();

        Patient patient = patientRepository
                .findById(patientId)
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID "
                                        + patientId
                                        + " not found."
                        )
                );

        validatePatientAccess(patient, currentUser);

        boolean professionalConnected =
                patientProfessionalContactRepository
                        .existsByPatientIdAndProfessionalContactId(
                                patientId,
                                professionalId
                        );

        if (!professionalConnected) {
            throw new IllegalArgumentException(
                    "The selected professional is not connected to this patient."
            );
        }

        List<Document> documents =
                documentRepository
                        .findByPatientIdAndIssuedByIdOrderByUploadedAtDesc(
                                patientId,
                                professionalId
                        );

        if (isCoordinator(patient, currentUser)) {
            documents = documents.stream()
                    .filter(document ->
                            document.getVisibility()
                                    == DocumentVisibility.SHARED
                                    ||
                                    document.getUploadedBy()
                                            .getId()
                                            .equals(currentUser.getId())
                    )
                    .toList();
        }

        return documents.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Document findAccessibleDocument(
            Long documentId,
            User currentUser
    ) {

        Document document =
                documentRepository
                        .findById(documentId)
                        .orElseThrow(() ->
                                new DocumentNotFoundException(
                                        documentId
                                )
                        );

        Patient patient = document.getPatient();

        validatePatientAccess(patient, currentUser);

        boolean parent = isParent(
                patient,
                currentUser
        );

        boolean author =
                document.getUploadedBy() != null
                        && document.getUploadedBy()
                        .getId()
                        .equals(currentUser.getId());

        boolean shared =
                document.getVisibility()
                        == DocumentVisibility.SHARED;

        if (!parent && !author && !shared) {
            throw new DocumentAccessDeniedException();
        }

        return document;
    }

    private void validatePatientAccess(
            Patient patient,
            User user
    ) {

        if (!isParent(patient, user)
                && !isCoordinator(patient, user)) {

            throw new DocumentAccessDeniedException(
                    "You do not have access to this patient's documents."
            );
        }
    }

    private void validateOwnership(
            Document document,
            User currentUser
    ) {

        boolean author =
                document.getUploadedBy() != null
                        && document.getUploadedBy()
                        .getId()
                        .equals(currentUser.getId());

        if (!author) {
            throw new DocumentAccessDeniedException(
                    "You can only modify or delete documents that you uploaded."
            );
        }
    }

    private boolean isParent(
            Patient patient,
            User user
    ) {

        return patient.getParent() != null
                && patient.getParent()
                .getId()
                .equals(user.getId());
    }

    private boolean isCoordinator(
            Patient patient,
            User user
    ) {

        return patient.getSupportCoordinator() != null
                && patient.getSupportCoordinator()
                .getId()
                .equals(user.getId());
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "No authenticated user."
            );
        }

        return userRepository
                .findByEmailIgnoreCase(
                        authentication.getName()
                )
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found."
                        )
                );
    }

    private String normalizeOptionalText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private DocumentResponse mapToResponse(
            Document document
    ) {

        User uploadedBy = document.getUploadedBy();

        ProfessionalContact issuedBy =
                document.getIssuedBy();

        String issuedByName =
                issuedBy != null
                        ? issuedBy.getFirstName()
                        + " "
                        + issuedBy.getLastName()
                        : null;

        String uploadedByName =
                uploadedBy.getFirstName()
                        + " "
                        + uploadedBy.getLastName();

        return DocumentResponse.builder()
                .id(document.getId())
                .patientId(
                        document.getPatient().getId()
                )
                .title(document.getTitle())
                .documentType(
                        document.getDocumentType()
                )
                .originalFileName(
                        document.getOriginalFileName()
                )
                .contentType(
                        document.getContentType()
                )
                .fileSize(document.getFileSize())
                .description(
                        document.getDescription()
                )
                .documentDate(
                        document.getDocumentDate()
                )

                .issuedById(
                        issuedBy != null
                                ? issuedBy.getId()
                                : null
                )
                .issuedByName(issuedByName)
                .issuedByProfessionalType(
                        issuedBy != null
                                ? issuedBy.getProfessionalType()
                                : null
                )

                .visibility(
                        document.getVisibility()
                )
                .uploadedById(uploadedBy.getId())
                .uploadedByName(uploadedByName)
                .uploadedByRole(
                        uploadedBy.getRole()
                )
                .uploadedAt(
                        document.getUploadedAt()
                )
                .updatedAt(
                        document.getUpdatedAt()
                )
                .build();
    }

    private ProfessionalContact resolveIssuedBy(
            Long patientId,
            Long issuedById
    ) {

        if (issuedById == null) {
            return null;
        }

        PatientProfessionalContact connection =
                patientProfessionalContactRepository
                        .findByPatientIdAndProfessionalContactId(
                                patientId,
                                issuedById
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "The selected professional is not connected to this patient."
                                )
                        );

        return connection.getProfessionalContact();
    }
}