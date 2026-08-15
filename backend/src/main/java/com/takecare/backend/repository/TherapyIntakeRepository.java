package com.takecare.backend.repository;

import com.takecare.backend.model.TherapyIntake;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TherapyIntakeRepository
        extends JpaRepository<TherapyIntake, Long> {

    List<TherapyIntake> findByTherapyIdOrderByScheduledAtDesc(
            Long therapyId
    );

    List<TherapyIntake>
    findByTherapyPatientIdAndScheduledAtBetweenOrderByScheduledAtAsc(
            Long patientId,
            LocalDateTime start,
            LocalDateTime end
    );

    Optional<TherapyIntake> findByTherapyIdAndScheduledAt(
            Long therapyId,
            LocalDateTime scheduledAt
    );
}