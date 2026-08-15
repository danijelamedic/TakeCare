package com.takecare.backend.controller;

import com.takecare.backend.dto.professionalcontact.ProfessionalContactResponse;
import com.takecare.backend.service.ProfessionalContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professional-contacts")
@RequiredArgsConstructor
public class ProfessionalContactController {

    private final ProfessionalContactService professionalContactService;

    @GetMapping
    public ResponseEntity<List<ProfessionalContactResponse>>
    getAllProfessionals() {
        return ResponseEntity.ok(
                professionalContactService.getAllProfessionals()
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ProfessionalContactResponse>>
    getProfessionalsForPatient(
            @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(
                professionalContactService
                        .getProfessionalsForPatient(patientId)
        );
    }

    @GetMapping("/{contactId}/patient/{patientId}")
    public ResponseEntity<ProfessionalContactResponse>
    getProfessionalDetails(
            @PathVariable Long contactId,
            @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(
                professionalContactService.getProfessionalDetails(
                        contactId,
                        patientId
                )
        );
    }

    @PostMapping("/{contactId}/patients/{patientId}")
    public ResponseEntity<ProfessionalContactResponse>
    connectProfessionalToPatient(
            @PathVariable Long contactId,
            @PathVariable Long patientId
    ) {
        ProfessionalContactResponse response =
                professionalContactService
                        .connectProfessionalToPatient(
                                contactId,
                                patientId
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @DeleteMapping("/{contactId}/patients/{patientId}")
    public ResponseEntity<Void> disconnectProfessionalFromPatient(
            @PathVariable Long contactId,
            @PathVariable Long patientId
    ) {
        professionalContactService
                .disconnectProfessionalFromPatient(
                        contactId,
                        patientId
                );

        return ResponseEntity.noContent().build();
    }
}