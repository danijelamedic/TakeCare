package com.takecare.backend.repository;

import com.takecare.backend.model.PatientProfessionalContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientProfessionalContactRepository
        extends JpaRepository<PatientProfessionalContact, Long> {

    List<PatientProfessionalContact>
    findByPatientIdOrderByProfessionalContactLastNameAscProfessionalContactFirstNameAsc(
            Long patientId
    );

    Optional<PatientProfessionalContact>
    findByPatientIdAndProfessionalContactId(
            Long patientId,
            Long professionalContactId
    );

    boolean existsByPatientIdAndProfessionalContactId(
            Long patientId,
            Long professionalContactId
    );

    void deleteByPatientIdAndProfessionalContactId(
            Long patientId,
            Long professionalContactId
    );
}