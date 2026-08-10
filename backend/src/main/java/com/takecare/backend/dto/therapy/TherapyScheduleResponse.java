package com.takecare.backend.dto.therapy;

import lombok.Builder;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Getter
@Builder
public class TherapyScheduleResponse {

    private Long id;

    private LocalTime time;

    private Set<DayOfWeek> daysOfWeek;

    private String frequencyDescription;

    private LocalDate startDate;

    private LocalDate endDate;

    private String instructions;
}