package com.takecare.backend.dto.therapy;

import com.takecare.backend.model.enums.TherapyStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class TherapyRequest {

    @NotNull(message = "Patient is required.")
    private Long patientId;

    @NotBlank(message = "Therapy name is required.")
    @Size(
            max = 150,
            message = "Therapy name cannot exceed 150 characters."
    )
    private String name;

    private String description;

    @Size(
            max = 100,
            message = "Dosage cannot exceed 100 characters."
    )
    private String dosage;

    @Size(
            max = 150,
            message = "Frequency cannot exceed 150 characters."
    )
    private String frequency;

    private String instructions;

    @NotNull(message = "Therapy start date is required.")
    private LocalDate startDate;

    private LocalDate endDate;

    private TherapyStatus status;

    private Long prescribedById;

    private String notes;

    @Valid
    @NotEmpty(message = "At least one therapy schedule is required.")
    private List<TherapyScheduleRequest> schedules;
}