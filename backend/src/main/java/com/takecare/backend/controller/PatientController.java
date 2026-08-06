package com.takecare.backend.controller;

import com.takecare.backend.dto.patient.PatientRequest;
import com.takecare.backend.dto.patient.PatientResponse;
import com.takecare.backend.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<PatientResponse> createPatient(
            @Valid @RequestBody PatientRequest request
    ) {
        PatientResponse response = patientService.createPatient(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<PatientResponse> getCurrentUserPatient() {
        PatientResponse response = patientService.getCurrentUserPatient();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<PatientResponse> updateCurrentUserPatient(
            @Valid @RequestBody PatientRequest request
    ) {
        PatientResponse response =
                patientService.updateCurrentUserPatient(request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('SUPPORT_COORDINATOR')")
    public PatientResponse getAssignedPatient() {
        return patientService.getAssignedPatient();
    }
}