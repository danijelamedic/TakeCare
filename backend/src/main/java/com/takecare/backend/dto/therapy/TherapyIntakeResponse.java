package com.takecare.backend.dto.therapy;

import com.takecare.backend.model.enums.Role;
import com.takecare.backend.model.enums.TherapyIntakeStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TherapyIntakeResponse {

    private Long id;

    private Long therapyId;

    private String therapyName;

    private Long patientId;

    private LocalDateTime scheduledAt;

    private TherapyIntakeStatus status;

    private LocalDateTime takenAt;

    private String notes;

    private Long recordedById;

    private String recordedByName;

    private Role recordedByRole;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}