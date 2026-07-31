package com.takecare.backend.repository;

import com.takecare.backend.model.Patient;
import com.takecare.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByParent(User parent);

    boolean existsByParent(User parent);

    Optional<Patient> findBySupportCoordinator(User supportCoordinator);
}