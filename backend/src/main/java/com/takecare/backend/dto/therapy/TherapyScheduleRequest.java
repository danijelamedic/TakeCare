package com.takecare.backend.dto.therapy;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Getter
@Setter
public class TherapyScheduleRequest {

    @NotNull(message = "Schedule time is required.")
    private LocalTime time;

    @NotEmpty(message = "At least one day of the week is required.")
    private Set<DayOfWeek> daysOfWeek;

    @Size(
            max = 200,
            message = "Frequency description cannot exceed 200 characters."
    )
    private String frequencyDescription;

    @NotNull(message = "Schedule start date is required.")
    private LocalDate startDate;

    private LocalDate endDate;

    private String instructions;
}