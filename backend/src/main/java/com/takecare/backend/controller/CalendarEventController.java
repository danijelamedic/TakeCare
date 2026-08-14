package com.takecare.backend.controller;

import com.takecare.backend.dto.calendar.CalendarEventRequest;
import com.takecare.backend.dto.calendar.CalendarEventResponse;
import com.takecare.backend.service.CalendarEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @GetMapping
    public ResponseEntity<List<CalendarEventResponse>> getEvents(
            @RequestParam Long patientId,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE_TIME
            )
            LocalDateTime start,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE_TIME
            )
            LocalDateTime end
    ) {
        List<CalendarEventResponse> events =
                calendarEventService.getEvents(
                        patientId,
                        start,
                        end
                );

        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<CalendarEventResponse> getEvent(
            @PathVariable Long eventId
    ) {
        CalendarEventResponse event =
                calendarEventService.getEvent(eventId);

        return ResponseEntity.ok(event);
    }

    @PostMapping("/events")
    public ResponseEntity<CalendarEventResponse> createEvent(
            @RequestBody CalendarEventRequest request
    ) {
        CalendarEventResponse createdEvent =
                calendarEventService.createEvent(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdEvent);
    }

    @PutMapping("/events/{eventId}")
    public ResponseEntity<CalendarEventResponse> updateEvent(
            @PathVariable Long eventId,
            @RequestBody CalendarEventRequest request
    ) {
        CalendarEventResponse updatedEvent =
                calendarEventService.updateEvent(
                        eventId,
                        request
                );

        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long eventId
    ) {
        calendarEventService.deleteEvent(eventId);

        return ResponseEntity.noContent().build();
    }
}