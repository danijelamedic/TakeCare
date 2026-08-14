package com.takecare.backend.dto.appointment;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ProposeAppointmentTimeRequest {

    private LocalDateTime proposedDateTime;

    private String coordinatorComment;
}