package com.takecare.backend.repository;

import com.takecare.backend.model.ProfessionalContact;
import com.takecare.backend.model.enums.ProfessionalType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfessionalContactRepository
        extends JpaRepository<ProfessionalContact, Long> {

    List<ProfessionalContact> findAllByOrderByLastNameAscFirstNameAsc();

    List<ProfessionalContact>
    findByProfessionalTypeOrderByLastNameAscFirstNameAsc(
            ProfessionalType professionalType
    );

    List<ProfessionalContact>
    findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrderByLastNameAscFirstNameAsc(
            String firstName,
            String lastName
    );
}