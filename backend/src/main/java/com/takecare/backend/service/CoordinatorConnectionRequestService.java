package com.takecare.backend.service;

import com.takecare.backend.dto.coordinator.CoordinatorConnectionResponse;
import com.takecare.backend.exception.CareProfileRequiredException;
import com.takecare.backend.model.CoordinatorConnectionRequest;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoordinatorConnectionRequestService {

    private final CoordinatorConnectionRequestRepository requestRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public CoordinatorConnectionResponse sendRequest(
            Long coordinatorId
    ) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.PARENT) {
            throw new IllegalStateException(
                    "Only a parent can send a coordinator connection request"
            );
        }

        Patient patient = patientRepository.findByParent(currentUser)
                .orElseThrow(() -> new CareProfileRequiredException(
                        "Create a care profile before sending a coordinator connection request"
                ));

        if (patient.getSupportCoordinator() != null) {
            throw new IllegalStateException(
                    "The patient already has a support coordinator"
            );
        }

        if (requestRepository.existsByPatientAndStatus(
                patient,
                CoordinatorConnectionStatus.PENDING
        )) {
            throw new IllegalStateException(
                    "The patient already has a pending connection request"
            );
        }

        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> new IllegalStateException(
                        "The selected support coordinator was not found"
                ));

        if (coordinator.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "The selected user is not a support coordinator"
            );
        }

        if (!coordinator.isEnabled()) {
            throw new IllegalStateException(
                    "The selected support coordinator account is disabled"
            );
        }

        if (patientRepository.existsBySupportCoordinator(coordinator)) {
            throw new IllegalStateException(
                    "The selected support coordinator is already assigned"
            );
        }

        if (requestRepository.existsByCoordinatorAndStatus(
                coordinator,
                CoordinatorConnectionStatus.PENDING
        )) {
            throw new IllegalStateException(
                    "The selected support coordinator already has a pending request"
            );
        }

        CoordinatorConnectionRequest connectionRequest =
                CoordinatorConnectionRequest.builder()
                        .patient(patient)
                        .coordinator(coordinator)
                        .status(CoordinatorConnectionStatus.PENDING)
                        .build();

        CoordinatorConnectionRequest savedRequest =
                requestRepository.save(connectionRequest);

        return mapToResponse(savedRequest);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (
                authentication == null ||
                        !authentication.isAuthenticated()
        ) {
            throw new IllegalStateException(
                    "No authenticated user was found"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user was not found in the database"
                ));
    }

    private CoordinatorConnectionResponse mapToResponse(
            CoordinatorConnectionRequest request
    ) {
        Patient patient = request.getPatient();
        User coordinator = request.getCoordinator();

        return CoordinatorConnectionResponse.builder()
                .id(request.getId())
                .patientId(patient.getId())
                .patientFirstName(patient.getFirstName())
                .patientLastName(patient.getLastName())
                .coordinatorId(coordinator.getId())
                .coordinatorFirstName(coordinator.getFirstName())
                .coordinatorLastName(coordinator.getLastName())
                .coordinatorEmail(coordinator.getEmail())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .respondedAt(request.getRespondedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CoordinatorConnectionResponse> getPendingRequests() {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can view these requests"
            );
        }

        return requestRepository
                .findAllByCoordinatorAndStatusOrderByCreatedAtDesc(
                        currentUser,
                        CoordinatorConnectionStatus.PENDING
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public CoordinatorConnectionResponse acceptRequest(Long requestId) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can accept this request"
            );
        }

        CoordinatorConnectionRequest request = requestRepository
                .findByIdAndStatus(
                        requestId,
                        CoordinatorConnectionStatus.PENDING
                )
                .orElseThrow(() -> new IllegalStateException(
                        "Pending connection request was not found"
                ));

        if (!request.getCoordinator().getId().equals(currentUser.getId())) {
            throw new IllegalStateException(
                    "This request is not assigned to the current coordinator"
            );
        }

        if (patientRepository.existsBySupportCoordinator(currentUser)) {
            throw new IllegalStateException(
                    "The current coordinator is already assigned to a patient"
            );
        }

        Patient patient = request.getPatient();

        if (patient.getSupportCoordinator() != null) {
            throw new IllegalStateException(
                    "The patient already has a support coordinator"
            );
        }

        patient.setSupportCoordinator(currentUser);
        patientRepository.save(patient);

        request.setStatus(CoordinatorConnectionStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());

        CoordinatorConnectionRequest savedRequest =
                requestRepository.save(request);

        return mapToResponse(savedRequest);
    }

    @Transactional
    public CoordinatorConnectionResponse declineRequest(Long requestId) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can decline this request"
            );
        }

        CoordinatorConnectionRequest request = requestRepository
                .findByIdAndStatus(
                        requestId,
                        CoordinatorConnectionStatus.PENDING
                )
                .orElseThrow(() -> new IllegalStateException(
                        "Pending connection request was not found"
                ));

        if (!request.getCoordinator().getId().equals(currentUser.getId())) {
            throw new IllegalStateException(
                    "This request is not assigned to the current coordinator"
            );
        }

        request.setStatus(CoordinatorConnectionStatus.DECLINED);
        request.setRespondedAt(LocalDateTime.now());

        CoordinatorConnectionRequest savedRequest =
                requestRepository.save(request);

        return mapToResponse(savedRequest);
    }
}