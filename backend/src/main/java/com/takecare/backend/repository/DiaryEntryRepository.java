package com.takecare.backend.repository;

import com.takecare.backend.model.DiaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {

    List<DiaryEntry> findByPatientIdOrderByEntryDateDescCreatedAtDesc(Long patientId);

    List<DiaryEntry> findByPatientIdAndVisibilityOrderByEntryDateDescCreatedAtDesc(
            Long patientId,
            com.takecare.backend.model.enums.DiaryEntryVisibility visibility
    );
}