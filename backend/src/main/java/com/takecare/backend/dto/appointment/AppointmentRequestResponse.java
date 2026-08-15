package com.takecare.backend.dto.appointment;

import com.takecare.backend.model.enums.AppointmentRequestStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AppointmentRequestResponse {

    private Long id;

    private Long patientId;
    private String patientName;

    private Long requestedById;
    private String requestedByName;

    private Long professionalContactId;
    private String professionalName;
    private String professionalProfession;

    private LocalDateTime requestedDateTime;
    private LocalDateTime proposedDateTime;

    private String reason;
    private AppointmentRequestStatus status;
    private String coordinatorComment;

    private Long processedById;
    private String processedByName;

    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}