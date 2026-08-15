package com.takecare.backend.controller;

import com.takecare.backend.dto.document.DocumentDownload;
import com.takecare.backend.dto.document.DocumentResponse;
import com.takecare.backend.dto.document.DocumentUploadRequest;
import com.takecare.backend.dto.document.UpdateDocumentRequest;
import com.takecare.backend.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DocumentResponse> uploadDocument(
            @Valid @ModelAttribute DocumentUploadRequest request
    ) {

        DocumentResponse response =
                documentService.uploadDocument(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<DocumentResponse>>
    getDocumentsForPatient(
            @PathVariable Long patientId
    ) {

        List<DocumentResponse> response =
                documentService.getDocumentsForPatient(
                        patientId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getDocument(
            @PathVariable Long documentId
    ) {

        DocumentResponse response =
                documentService.getDocument(documentId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable Long documentId,
            @Valid @RequestBody UpdateDocumentRequest request
    ) {

        DocumentResponse response =
                documentService.updateDocument(
                        documentId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{documentId}/content")
    public ResponseEntity<Resource> viewDocument(
            @PathVariable Long documentId
    ) {

        DocumentDownload document =
                documentService.downloadDocument(
                        documentId
                );

        return buildFileResponse(
                document,
                false
        );
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId
    ) {

        DocumentDownload document =
                documentService.downloadDocument(
                        documentId
                );

        return buildFileResponse(
                document,
                true
        );
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long documentId
    ) {

        documentService.deleteDocument(documentId);

        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<Resource> buildFileResponse(
            DocumentDownload document,
            boolean download
    ) {

        MediaType mediaType;

        try {
            mediaType = MediaType.parseMediaType(
                    document.contentType()
            );
        } catch (Exception exception) {
            mediaType =
                    MediaType.APPLICATION_OCTET_STREAM;
        }

        ContentDisposition disposition =
                download
                        ? ContentDisposition
                        .attachment()
                        .filename(
                                document.originalFileName(),
                                StandardCharsets.UTF_8
                        )
                        .build()
                        : ContentDisposition
                        .inline()
                        .filename(
                                document.originalFileName(),
                                StandardCharsets.UTF_8
                        )
                        .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        disposition.toString()
                )
                .body(document.resource());
    }

    @GetMapping("/patient/{patientId}/professional/{professionalId}")
    public ResponseEntity<List<DocumentResponse>>
    getDocumentsForProfessional(
            @PathVariable Long patientId,
            @PathVariable Long professionalId
    ) {

        List<DocumentResponse> response =
                documentService
                        .getDocumentsForProfessional(
                                patientId,
                                professionalId
                        );

        return ResponseEntity.ok(response);
    }
}