package com.takecare.backend.repository;

import com.takecare.backend.model.AppointmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRequestRepository
        extends JpaRepository<AppointmentRequest, Long> {

    List<AppointmentRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<AppointmentRequest> findByPatientSupportCoordinatorIdOrderByCreatedAtDesc(
            Long coordinatorId
    );
}