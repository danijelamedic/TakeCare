package com.takecare.backend.service;

import com.takecare.backend.dto.patient.PatientRequest;
import com.takecare.backend.dto.patient.PatientResponse;
import com.takecare.backend.exception.PatientAlreadyExistsException;
import com.takecare.backend.exception.PatientNotFoundException;
import com.takecare.backend.model.Patient;
import com.takecare.backend.model.User;
import com.takecare.backend.repository.PatientRepository;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        User currentUser = getCurrentUser();

        if (patientRepository.existsByParent(currentUser)) {
            throw new PatientAlreadyExistsException(
                    "A patient profile already exists for this parent"
            );
        }

        Patient patient = Patient.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .profileImage(request.getProfileImage())
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .bloodType(request.getBloodType())
                .allergies(request.getAllergies())
                .specialNeeds(request.getSpecialNeeds())
                .importantInformation(request.getImportantInformation())
                .generalNotes(request.getGeneralNotes())
                .chronicDiseases(request.getChronicDiseases())
                .diagnoses(request.getDiagnoses())
                .parent(currentUser)
                .build();

        Patient savedPatient = patientRepository.save(patient);

        return mapToResponse(savedPatient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getCurrentUserPatient() {
        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findByParent(currentUser)
                .orElseThrow(() -> new PatientNotFoundException(
                        "Patient profile was not found for the current user"
                ));

        return mapToResponse(patient);
    }

    @Transactional
    public PatientResponse updateCurrentUserPatient(PatientRequest request) {
        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findByParent(currentUser)
                .orElseThrow(() -> new PatientNotFoundException(
                        "Patient profile was not found for the current user"
                ));

        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setProfileImage(request.getProfileImage());
        patient.setAddress(request.getAddress());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        patient.setBloodType(request.getBloodType());
        patient.setAllergies(request.getAllergies());
        patient.setSpecialNeeds(request.getSpecialNeeds());
        patient.setChronicDiseases(request.getChronicDiseases());
        patient.setDiagnoses(request.getDiagnoses());
        patient.setImportantInformation(request.getImportantInformation());
        patient.setGeneralNotes(request.getGeneralNotes());

        Patient updatedPatient = patientRepository.save(patient);

        return mapToResponse(updatedPatient);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user was found");
        }

        String email = authentication.getName();

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user was not found in the database"
                ));
    }

    private PatientResponse mapToResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .profileImage(patient.getProfileImage())
                .address(patient.getAddress())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .bloodType(patient.getBloodType())
                .allergies(patient.getAllergies())
                .specialNeeds(patient.getSpecialNeeds())
                .importantInformation(patient.getImportantInformation())
                .chronicDiseases(patient.getChronicDiseases())
                .diagnoses(patient.getDiagnoses())
                .generalNotes(patient.getGeneralNotes())
                .parentId(
                        patient.getParent() != null
                                ? patient.getParent().getId()
                                : null
                )
                .supportCoordinatorId(
                        patient.getSupportCoordinator() != null
                                ? patient.getSupportCoordinator().getId()
                                : null
                )
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}