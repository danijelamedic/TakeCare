package com.takecare.backend.dto.calendar;

import com.takecare.backend.model.enums.CalendarEventStatus;
import com.takecare.backend.model.enums.CalendarEventType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class CalendarEventResponse {

    private Long id;

    private Long patientId;

    private String title;

    private String description;

    private CalendarEventType eventType;

    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    private String location;

    private CalendarEventStatus status;

    private Long createdById;

    private String createdByName;

    private Long professionalContactId;

    private String professionalName;

    private String professionalProfession;

    private Long appointmentRequestId;

    private Long therapyId;

    private Long therapyScheduleId;

    private boolean generatedFromTherapy;

    private boolean reminderEnabled;

    private Integer reminderMinutesBefore;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}