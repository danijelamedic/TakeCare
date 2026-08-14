package com.takecare.backend.dto.calendar;

import com.takecare.backend.model.enums.CalendarEventStatus;
import com.takecare.backend.model.enums.CalendarEventType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CalendarEventRequest {

    private Long patientId;

    private String title;

    private String description;

    private CalendarEventType eventType;

    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    private String location;

    private CalendarEventStatus status;

    private Long professionalContactId;

    private boolean reminderEnabled;

    private Integer reminderMinutesBefore;
}