package com.takecare.backend.controller;

import com.takecare.backend.dto.coordinator.CoordinatorConnectionCreateRequest;
import com.takecare.backend.dto.coordinator.CoordinatorConnectionResponse;
import com.takecare.backend.service.CoordinatorConnectionRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coordinator-connections")
@RequiredArgsConstructor
public class CoordinatorConnectionRequestController {

    private final CoordinatorConnectionRequestService
            coordinatorConnectionRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PARENT')")
    public CoordinatorConnectionResponse sendRequest(
            @Valid @RequestBody CoordinatorConnectionCreateRequest request
    ) {

        return coordinatorConnectionRequestService
                .sendRequest(request.getCoordinatorId());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPPORT_COORDINATOR')")
    public List<CoordinatorConnectionResponse> getPendingRequests() {
        return coordinatorConnectionRequestService.getPendingRequests();
    }

    @PatchMapping("/{requestId}/accept")
    @PreAuthorize("hasRole('SUPPORT_COORDINATOR')")
    public CoordinatorConnectionResponse acceptRequest(
            @PathVariable Long requestId
    ) {
        return coordinatorConnectionRequestService
                .acceptRequest(requestId);
    }

    @PatchMapping("/{requestId}/decline")
    @PreAuthorize("hasRole('SUPPORT_COORDINATOR')")
    public CoordinatorConnectionResponse declineRequest(
            @PathVariable Long requestId
    ) {
        return coordinatorConnectionRequestService
                .declineRequest(requestId);
    }
}