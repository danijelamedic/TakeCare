package com.takecare.backend.repository;

import com.takecare.backend.model.ProfessionalContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProfessionalContactRepository
        extends JpaRepository<ProfessionalContact, Long> {

    List<ProfessionalContact> findByPatientIdOrderByLastNameAscFirstNameAsc(
            Long patientId
    );

    Optional<ProfessionalContact> findByIdAndPatientId(
            Long contactId,
            Long patientId
    );
}