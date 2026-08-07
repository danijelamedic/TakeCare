package com.takecare.backend.service;

import com.takecare.backend.dto.coordinator.SupportCoordinatorResponse;
import com.takecare.backend.exception.PatientNotFoundException;
import com.takecare.backend.model.Patient;
import com.takecare.backend.model.User;
import com.takecare.backend.model.enums.CoordinatorConnectionStatus;
import com.takecare.backend.model.enums.Role;
import com.takecare.backend.repository.CoordinatorConnectionRequestRepository;
import com.takecare.backend.repository.PatientRepository;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportCoordinatorService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final CoordinatorConnectionRequestRepository requestRepository;

    @Transactional(readOnly = true)
    public List<SupportCoordinatorResponse> getAvailableCoordinators() {
        return userRepository
                .findAllByRoleAndEnabledTrueOrderByFirstNameAscLastNameAsc(
                        Role.SUPPORT_COORDINATOR
                )
                .stream()
                .filter(coordinator ->
                        !patientRepository.existsBySupportCoordinator(coordinator)
                )
                .filter(coordinator ->
                        !requestRepository.existsByCoordinatorAndStatus(
                                coordinator,
                                CoordinatorConnectionStatus.PENDING
                        )
                )
                .map(this::mapToResponse)
                .toList();
    }

    private SupportCoordinatorResponse mapToResponse(User coordinator) {
        return SupportCoordinatorResponse.builder()
                .id(coordinator.getId())
                .firstName(coordinator.getFirstName())
                .lastName(coordinator.getLastName())
                .email(coordinator.getEmail())
                .build();
    }

    @Transactional(readOnly = true)
    public SupportCoordinatorResponse getAssignedCoordinator() {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.PARENT) {
            throw new IllegalStateException(
                    "Only a parent can view the assigned support coordinator"
            );
        }

        Patient patient = patientRepository
                .findByParent(currentUser)
                .orElseThrow(() -> new PatientNotFoundException(
                        "The current parent does not have a patient profile"
                ));

        User coordinator = patient.getSupportCoordinator();

        if (coordinator == null) {
            throw new IllegalStateException(
                    "The patient does not have an assigned support coordinator"
            );
        }

        return mapToResponse(coordinator);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (
                authentication == null ||
                        !authentication.isAuthenticated()
        ) {
            throw new IllegalStateException(
                    "No authenticated user was found"
            );
        }

        return userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user was not found"
                ));
    }
}