package com.takecare.backend.service;

import com.takecare.backend.dto.professionalcontact.ProfessionalContactResponse;
import com.takecare.backend.exception.PatientNotFoundException;
import com.takecare.backend.exception.ProfessionalContactAccessDeniedException;
import com.takecare.backend.exception.ProfessionalContactNotFoundException;
import com.takecare.backend.model.Patient;
import com.takecare.backend.model.PatientProfessionalContact;
import com.takecare.backend.model.ProfessionalContact;
import com.takecare.backend.model.User;
import com.takecare.backend.model.enums.Role;
import com.takecare.backend.repository.PatientProfessionalContactRepository;
import com.takecare.backend.repository.PatientRepository;
import com.takecare.backend.repository.ProfessionalContactRepository;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfessionalContactService {

    private final ProfessionalContactRepository professionalContactRepository;
    private final PatientProfessionalContactRepository
            patientProfessionalContactRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public List<ProfessionalContactResponse> getAllProfessionals() {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new ProfessionalContactAccessDeniedException(
                    "Only support coordinators can access the professional catalogue"
            );
        }

        return professionalContactRepository
                .findAllByOrderByLastNameAscFirstNameAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ProfessionalContactResponse> getProfessionalsForPatient(
            Long patientId
    ) {
        Patient patient = getPatient(patientId);
        User currentUser = getCurrentUser();

        checkPatientAccess(patient, currentUser);

        return patientProfessionalContactRepository
                .findByPatientIdOrderByProfessionalContactLastNameAscProfessionalContactFirstNameAsc(
                        patientId
                )
                .stream()
                .map(PatientProfessionalContact::getProfessionalContact)
                .map(this::mapToResponse)
                .toList();
    }

    public ProfessionalContactResponse getProfessionalDetails(
            Long contactId,
            Long patientId
    ) {
        Patient patient = getPatient(patientId);
        User currentUser = getCurrentUser();

        checkPatientAccess(patient, currentUser);

        ProfessionalContact professionalContact =
                patientProfessionalContactRepository
                        .findByPatientIdAndProfessionalContactId(
                                patientId,
                                contactId
                        )
                        .map(PatientProfessionalContact::getProfessionalContact)
                        .orElseThrow(() ->
                                new ProfessionalContactNotFoundException(contactId)
                        );

        return mapToResponse(professionalContact);
    }

    @Transactional
    public ProfessionalContactResponse connectProfessionalToPatient(
            Long contactId,
            Long patientId
    ) {
        Patient patient = getPatient(patientId);
        User currentUser = getCurrentUser();

        checkCoordinatorAccess(patient, currentUser);

        ProfessionalContact professionalContact =
                professionalContactRepository.findById(contactId)
                        .orElseThrow(() ->
                                new ProfessionalContactNotFoundException(contactId)
                        );

        boolean alreadyConnected =
                patientProfessionalContactRepository
                        .existsByPatientIdAndProfessionalContactId(
                                patientId,
                                contactId
                        );

        if (alreadyConnected) {
            throw new IllegalArgumentException(
                    "This professional is already connected to the patient"
            );
        }

        PatientProfessionalContact connection =
                new PatientProfessionalContact();

        connection.setPatient(patient);
        connection.setProfessionalContact(professionalContact);
        connection.setLinkedBy(currentUser);

        patientProfessionalContactRepository.save(connection);

        return mapToResponse(professionalContact);
    }

    @Transactional
    public void disconnectProfessionalFromPatient(
            Long contactId,
            Long patientId
    ) {
        Patient patient = getPatient(patientId);
        User currentUser = getCurrentUser();

        checkCoordinatorAccess(patient, currentUser);

        PatientProfessionalContact connection =
                patientProfessionalContactRepository
                        .findByPatientIdAndProfessionalContactId(
                                patientId,
                                contactId
                        )
                        .orElseThrow(() ->
                                new ProfessionalContactNotFoundException(contactId)
                        );

        patientProfessionalContactRepository.delete(connection);
    }

    private Patient getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException(
                        "Patient with ID " + patientId + " was not found"
                ));
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ProfessionalContactAccessDeniedException(
                    "Authentication is required"
            );
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() ->
                        new ProfessionalContactAccessDeniedException(
                                "Authenticated user was not found"
                        )
                );
    }

    private void checkPatientAccess(
            Patient patient,
            User currentUser
    ) {
        boolean isParent =
                patient.getParent() != null &&
                        patient.getParent().getId().equals(currentUser.getId());

        boolean isAssignedCoordinator =
                patient.getSupportCoordinator() != null &&
                        patient.getSupportCoordinator()
                                .getId()
                                .equals(currentUser.getId());

        if (!isParent && !isAssignedCoordinator) {
            throw new ProfessionalContactAccessDeniedException(
                    "You do not have permission to access this patient's professional contacts"
            );
        }
    }

    private void checkCoordinatorAccess(
            Patient patient,
            User currentUser
    ) {
        boolean isAssignedCoordinator =
                currentUser.getRole() == Role.SUPPORT_COORDINATOR &&
                        patient.getSupportCoordinator() != null &&
                        patient.getSupportCoordinator()
                                .getId()
                                .equals(currentUser.getId());

        if (!isAssignedCoordinator) {
            throw new ProfessionalContactAccessDeniedException(
                    "Only the assigned support coordinator can manage this patient's professional contacts"
            );
        }
    }

    private ProfessionalContactResponse mapToResponse(
            ProfessionalContact professionalContact
    ) {
        return new ProfessionalContactResponse(
                professionalContact.getId(),
                professionalContact.getFirstName(),
                professionalContact.getLastName(),
                professionalContact.getFirstName()
                        + " "
                        + professionalContact.getLastName(),
                professionalContact.getProfessionalType(),
                professionalContact.getSpecialization(),
                professionalContact.getInstitutionName(),
                professionalContact.getPhoneNumber(),
                professionalContact.getEmail(),
                professionalContact.getAddress(),
                professionalContact.getWorkingHours(),
                professionalContact.getNotes(),
                professionalContact.getCreatedAt(),
                professionalContact.getUpdatedAt()
        );
    }
}