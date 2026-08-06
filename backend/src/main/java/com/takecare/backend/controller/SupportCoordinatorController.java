package com.takecare.backend.controller;

import com.takecare.backend.dto.coordinator.SupportCoordinatorResponse;
import com.takecare.backend.service.SupportCoordinatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/support-coordinators")
@RequiredArgsConstructor
public class SupportCoordinatorController {

    private final SupportCoordinatorService supportCoordinatorService;

    @GetMapping("/available")
    @PreAuthorize("hasRole('PARENT')")
    public List<SupportCoordinatorResponse> getAvailableCoordinators() {
        return supportCoordinatorService.getAvailableCoordinators();
    }
}