package com.takecare.backend.controller;

import com.takecare.backend.dto.appointment.AppointmentRequestResponse;
import com.takecare.backend.dto.appointment.CreateAppointmentRequestRequest;
import com.takecare.backend.dto.appointment.ProposeAppointmentTimeRequest;
import com.takecare.backend.dto.appointment.RejectAppointmentRequest;
import com.takecare.backend.dto.appointment.RespondToProposedTimeRequest;
import com.takecare.backend.service.AppointmentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointment-requests")
@RequiredArgsConstructor
public class AppointmentRequestController {

    private final AppointmentRequestService appointmentRequestService;

    @PostMapping
    public ResponseEntity<AppointmentRequestResponse> createRequest(
            @RequestBody CreateAppointmentRequestRequest request
    ) {
        AppointmentRequestResponse response =
                appointmentRequestService.createRequest(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/parent")
    public ResponseEntity<List<AppointmentRequestResponse>>
    getParentRequests() {

        return ResponseEntity.ok(
                appointmentRequestService.getParentRequests()
        );
    }

    @GetMapping("/coordinator")
    public ResponseEntity<List<AppointmentRequestResponse>>
    getCoordinatorRequests() {

        return ResponseEntity.ok(
                appointmentRequestService.getCoordinatorRequests()
        );
    }

    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<AppointmentRequestResponse> approveRequest(
            @PathVariable Long requestId
    ) {
        return ResponseEntity.ok(
                appointmentRequestService.approveRequest(requestId)
        );
    }

    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<AppointmentRequestResponse> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody RejectAppointmentRequest request
    ) {
        return ResponseEntity.ok(
                appointmentRequestService.rejectRequest(
                        requestId,
                        request
                )
        );
    }

    @PatchMapping("/{requestId}/propose-time")
    public ResponseEntity<AppointmentRequestResponse> proposeNewTime(
            @PathVariable Long requestId,
            @RequestBody ProposeAppointmentTimeRequest request
    ) {
        return ResponseEntity.ok(
                appointmentRequestService.proposeNewTime(
                        requestId,
                        request
                )
        );
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<AppointmentRequestResponse>
    respondToProposedTime(
            @PathVariable Long requestId,
            @RequestBody RespondToProposedTimeRequest request
    ) {
        return ResponseEntity.ok(
                appointmentRequestService.respondToProposedTime(
                        requestId,
                        request
                )
        );
    }
}