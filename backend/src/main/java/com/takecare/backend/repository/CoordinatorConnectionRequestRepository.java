package com.takecare.backend.repository;

import com.takecare.backend.model.CoordinatorConnectionRequest;
import com.takecare.backend.model.Patient;
import com.takecare.backend.model.User;
import com.takecare.backend.model.enums.CoordinatorConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoordinatorConnectionRequestRepository
        extends JpaRepository<CoordinatorConnectionRequest, Long> {

    boolean existsByPatientAndStatus(
            Patient patient,
            CoordinatorConnectionStatus status
    );

    boolean existsByCoordinatorAndStatus(
            User coordinator,
            CoordinatorConnectionStatus status
    );

    Optional<CoordinatorConnectionRequest>
    findByIdAndStatus(
            Long id,
            CoordinatorConnectionStatus status
    );

    List<CoordinatorConnectionRequest>
    findAllByCoordinatorAndStatusOrderByCreatedAtDesc(
            User coordinator,
            CoordinatorConnectionStatus status
    );

    List<CoordinatorConnectionRequest>
    findAllByPatientOrderByCreatedAtDesc(
            Patient patient
    );
}