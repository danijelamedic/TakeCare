package com.takecare.backend.repository;

import com.takecare.backend.model.Therapy;
import com.takecare.backend.model.enums.TherapyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TherapyRepository extends JpaRepository<Therapy, Long> {

    List<Therapy> findByPatientIdOrderByStartDateDescCreatedAtDesc(
            Long patientId
    );

    List<Therapy> findByPatientIdAndStatusOrderByStartDateDescCreatedAtDesc(
            Long patientId,
            TherapyStatus status
    );

    Optional<Therapy> findByIdAndPatientId(
            Long therapyId,
            Long patientId
    );
}