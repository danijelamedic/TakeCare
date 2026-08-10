package com.takecare.backend.controller;

import com.takecare.backend.dto.therapy.TherapyIntakeRequest;
import com.takecare.backend.dto.therapy.TherapyIntakeResponse;
import com.takecare.backend.dto.therapy.TherapyRequest;
import com.takecare.backend.dto.therapy.TherapyResponse;
import com.takecare.backend.model.enums.TherapyStatus;
import com.takecare.backend.service.TherapyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/therapies")
@RequiredArgsConstructor
public class TherapyController {

    private final TherapyService therapyService;

    @PostMapping
    public ResponseEntity<TherapyResponse> createTherapy(
            @Valid @RequestBody TherapyRequest request
    ) {
        TherapyResponse response =
                therapyService.createTherapy(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<TherapyResponse>>
    getTherapiesForPatient(
            @PathVariable Long patientId,
            @RequestParam(required = false) TherapyStatus status
    ) {
        List<TherapyResponse> response =
                therapyService.getTherapiesForPatient(
                        patientId,
                        status
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{therapyId}")
    public ResponseEntity<TherapyResponse> getTherapy(
            @PathVariable Long therapyId
    ) {
        TherapyResponse response =
                therapyService.getTherapy(therapyId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{therapyId}")
    public ResponseEntity<TherapyResponse> updateTherapy(
            @PathVariable Long therapyId,
            @Valid @RequestBody TherapyRequest request
    ) {
        TherapyResponse response =
                therapyService.updateTherapy(
                        therapyId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{therapyId}/status")
    public ResponseEntity<TherapyResponse> updateTherapyStatus(
            @PathVariable Long therapyId,
            @RequestParam TherapyStatus status
    ) {
        TherapyResponse response =
                therapyService.updateTherapyStatus(
                        therapyId,
                        status
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{therapyId}/intakes")
    public ResponseEntity<TherapyIntakeResponse>
    recordTherapyIntake(
            @PathVariable Long therapyId,
            @Valid @RequestBody TherapyIntakeRequest request
    ) {
        TherapyIntakeResponse response =
                therapyService.recordTherapyIntake(
                        therapyId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{therapyId}/intakes")
    public ResponseEntity<List<TherapyIntakeResponse>>
    getIntakesForTherapy(
            @PathVariable Long therapyId
    ) {
        List<TherapyIntakeResponse> response =
                therapyService.getIntakesForTherapy(therapyId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/intakes/{intakeId}")
    public ResponseEntity<TherapyIntakeResponse>
    updateTherapyIntake(
            @PathVariable Long intakeId,
            @Valid @RequestBody TherapyIntakeRequest request
    ) {
        TherapyIntakeResponse response =
                therapyService.updateTherapyIntake(
                        intakeId,
                        request
                );

        return ResponseEntity.ok(response);
    }
}