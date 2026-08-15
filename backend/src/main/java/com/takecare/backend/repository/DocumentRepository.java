package com.takecare.backend.repository;

import com.takecare.backend.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByPatientIdOrderByUploadedAtDesc(Long patientId);
    List<Document> findByPatientIdAndIssuedByIdOrderByUploadedAtDesc(
            Long patientId,
            Long issuedById
    );

}