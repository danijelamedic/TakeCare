package com.takecare.backend.dto.therapy;

import com.takecare.backend.model.enums.Role;
import com.takecare.backend.model.enums.TherapyStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TherapyResponse {

    private Long id;

    private Long patientId;

    private String name;

    private String description;

    private String dosage;

    private String frequency;

    private String instructions;

    private LocalDate startDate;

    private LocalDate endDate;

    private TherapyStatus status;

    private Long prescribedById;

    private String prescribedByName;

    private String prescribedByProfession;

    private Long createdById;

    private String createdByName;

    private Role createdByRole;

    private String notes;

    private List<TherapyScheduleResponse> schedules;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}