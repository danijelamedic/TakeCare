package com.takecare.backend.dto.therapy;

import com.takecare.backend.model.enums.TherapyIntakeStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TherapyIntakeRequest {

    @NotNull(message = "Scheduled time is required.")
    private LocalDateTime scheduledAt;

    @NotNull(message = "Intake status is required.")
    private TherapyIntakeStatus status;

    private LocalDateTime takenAt;

    private String notes;
}