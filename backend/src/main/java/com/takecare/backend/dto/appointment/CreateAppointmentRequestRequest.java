package com.takecare.backend.dto.appointment;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateAppointmentRequestRequest {

    private Long professionalContactId;

    private LocalDateTime requestedDateTime;

    private String reason;
}