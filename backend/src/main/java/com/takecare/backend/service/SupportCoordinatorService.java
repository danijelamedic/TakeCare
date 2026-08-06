package com.takecare.backend.service;

import com.takecare.backend.dto.coordinator.SupportCoordinatorResponse;
import com.takecare.backend.model.User;
import com.takecare.backend.model.enums.CoordinatorConnectionStatus;
import com.takecare.backend.model.enums.Role;
import com.takecare.backend.repository.CoordinatorConnectionRequestRepository;
import com.takecare.backend.repository.PatientRepository;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
}