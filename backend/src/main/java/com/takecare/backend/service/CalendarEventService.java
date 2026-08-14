package com.takecare.backend.service;

import com.takecare.backend.dto.calendar.CalendarEventRequest;
import com.takecare.backend.dto.calendar.CalendarEventResponse;
import com.takecare.backend.model.*;
import com.takecare.backend.model.enums.CalendarEventStatus;
import com.takecare.backend.model.enums.CalendarEventType;
import com.takecare.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final TherapyScheduleRepository therapyScheduleRepository;
    private final PatientRepository patientRepository;
    private final PatientProfessionalContactRepository patientProfessionalContactRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getEvents(
            Long patientId,
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    ) {
        validatePeriod(periodStart, periodEnd);

        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalStateException(
                        "Patient not found."
                ));

        validatePatientAccess(patient, currentUser);

        List<CalendarEventResponse> responses =
                new ArrayList<>();

        List<CalendarEvent> storedEvents =
                calendarEventRepository.findEventsInPeriod(
                        patientId,
                        periodStart,
                        periodEnd
                );

        storedEvents.stream()
                .map(this::mapStoredEventToResponse)
                .forEach(responses::add);

        LocalDate firstDate = periodStart.toLocalDate();
        LocalDate lastDate = periodEnd
                .minusNanos(1)
                .toLocalDate();

        List<TherapySchedule> schedules =
                therapyScheduleRepository
                        .findActiveSchedulesInPeriod(
                                patientId,
                                firstDate,
                                lastDate
                        );

        for (TherapySchedule schedule : schedules) {
            responses.addAll(
                    generateTherapyEvents(
                            schedule,
                            periodStart,
                            periodEnd
                    )
            );
        }

        responses.sort(
                Comparator.comparing(
                        CalendarEventResponse::getStartDateTime
                )
        );

        return responses;
    }

    private List<CalendarEventResponse> generateTherapyEvents(
            TherapySchedule schedule,
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    ) {
        List<CalendarEventResponse> responses =
                new ArrayList<>();

        Therapy therapy = schedule.getTherapy();

        LocalDate firstDate = latestDate(
                periodStart.toLocalDate(),
                schedule.getStartDate(),
                therapy.getStartDate()
        );

        LocalDate lastDate = earliestDate(
                periodEnd.minusNanos(1).toLocalDate(),
                schedule.getEndDate(),
                therapy.getEndDate()
        );

        if (lastDate.isBefore(firstDate)) {
            return responses;
        }

        LocalDate currentDate = firstDate;

        while (!currentDate.isAfter(lastDate)) {

            if (schedule.getDaysOfWeek()
                    .contains(currentDate.getDayOfWeek())) {

                LocalDateTime startDateTime =
                        currentDate.atTime(schedule.getTime());

                if (!startDateTime.isBefore(periodStart)
                        && startDateTime.isBefore(periodEnd)) {

                    responses.add(
                            mapTherapyScheduleToResponse(
                                    therapy,
                                    schedule,
                                    startDateTime
                            )
                    );
                }
            }

            currentDate = currentDate.plusDays(1);
        }

        return responses;
    }

    private CalendarEventResponse mapTherapyScheduleToResponse(
            Therapy therapy,
            TherapySchedule schedule,
            LocalDateTime startDateTime
    ) {
        ProfessionalContact prescribedBy =
                therapy.getPrescribedBy();

        String description = buildTherapyDescription(
                therapy,
                schedule
        );

        return CalendarEventResponse.builder()
                .id(null)
                .patientId(therapy.getPatient().getId())
                .title("Therapy: " + therapy.getName())
                .description(description)
                .eventType(CalendarEventType.THERAPY_SESSION)
                .startDateTime(startDateTime)
                .endDateTime(startDateTime.plusMinutes(30))
                .location(null)
                .status(CalendarEventStatus.PLANNED)
                .createdById(null)
                .createdByName(null)
                .professionalContactId(
                        prescribedBy != null
                                ? prescribedBy.getId()
                                : null
                )
                .professionalName(
                        prescribedBy != null
                                ? prescribedBy.getFirstName()
                                + " "
                                + prescribedBy.getLastName()
                                : null
                )
                .professionalProfession(
                        prescribedBy != null
                                && prescribedBy.getProfessionalType() != null
                                ? prescribedBy
                                .getProfessionalType()
                                .name()
                                : null
                )
                .appointmentRequestId(null)
                .therapyId(therapy.getId())
                .therapyScheduleId(schedule.getId())
                .generatedFromTherapy(true)
                .reminderEnabled(true)
                .reminderMinutesBefore(30)
                .createdAt(null)
                .updatedAt(null)
                .build();
    }

    private String buildTherapyDescription(
            Therapy therapy,
            TherapySchedule schedule
    ) {
        List<String> parts = new ArrayList<>();

        if (therapy.getDosage() != null
                && !therapy.getDosage().isBlank()) {
            parts.add("Dosage: " + therapy.getDosage());
        }

        if (schedule.getInstructions() != null
                && !schedule.getInstructions().isBlank()) {
            parts.add(schedule.getInstructions());
        } else if (therapy.getInstructions() != null
                && !therapy.getInstructions().isBlank()) {
            parts.add(therapy.getInstructions());
        }

        return parts.isEmpty()
                ? null
                : String.join(" · ", parts);
    }

    private CalendarEventResponse mapStoredEventToResponse(
            CalendarEvent event
    ) {
        User createdBy = event.getCreatedBy();

        ProfessionalContact professional =
                event.getProfessionalContact();

        AppointmentRequest appointmentRequest =
                event.getAppointmentRequest();

        return CalendarEventResponse.builder()
                .id(event.getId())
                .patientId(event.getPatient().getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType())
                .startDateTime(event.getStartDateTime())
                .endDateTime(event.getEndDateTime())
                .location(event.getLocation())
                .status(event.getStatus())
                .createdById(createdBy.getId())
                .createdByName(
                        createdBy.getFirstName()
                                + " "
                                + createdBy.getLastName()
                )
                .professionalContactId(
                        professional != null
                                ? professional.getId()
                                : null
                )
                .professionalName(
                        professional != null
                                ? professional.getFirstName()
                                + " "
                                + professional.getLastName()
                                : null
                )
                .professionalProfession(
                        professional != null
                                && professional.getProfessionalType() != null
                                ? professional
                                .getProfessionalType()
                                .name()
                                : null
                )
                .appointmentRequestId(
                        appointmentRequest != null
                                ? appointmentRequest.getId()
                                : null
                )
                .therapyId(null)
                .therapyScheduleId(null)
                .generatedFromTherapy(false)
                .reminderEnabled(event.isReminderEnabled())
                .reminderMinutesBefore(
                        event.getReminderMinutesBefore()
                )
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private void validatePeriod(
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    ) {
        if (periodStart == null || periodEnd == null) {
            throw new IllegalStateException(
                    "Calendar period start and end are required."
            );
        }

        if (!periodEnd.isAfter(periodStart)) {
            throw new IllegalStateException(
                    "Calendar period end must be after its start."
            );
        }

        if (periodEnd.isAfter(periodStart.plusYears(1))) {
            throw new IllegalStateException(
                    "Calendar period cannot be longer than one year."
            );
        }
    }

    private void validatePatientAccess(
            Patient patient,
            User user
    ) {
        boolean isParent =
                patient.getParent() != null
                        && patient.getParent()
                        .getId()
                        .equals(user.getId());

        boolean isCoordinator =
                patient.getSupportCoordinator() != null
                        && patient.getSupportCoordinator()
                        .getId()
                        .equals(user.getId());

        if (!isParent && !isCoordinator) {
            throw new IllegalStateException(
                    "You are not allowed to view this calendar."
            );
        }
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "No authenticated user."
            );
        }

        return userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user not found."
                ));
    }

    private LocalDate latestDate(LocalDate... dates) {
        LocalDate result = null;

        for (LocalDate date : dates) {
            if (date != null
                    && (result == null || date.isAfter(result))) {
                result = date;
            }
        }

        return result;
    }

    private LocalDate earliestDate(LocalDate... dates) {
        LocalDate result = null;

        for (LocalDate date : dates) {
            if (date != null
                    && (result == null || date.isBefore(result))) {
                result = date;
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public CalendarEventResponse getEvent(Long eventId) {

        User currentUser = getCurrentUser();

        CalendarEvent event = calendarEventRepository
                .findById(eventId)
                .orElseThrow(() -> new IllegalStateException(
                        "Calendar event not found."
                ));

        validatePatientAccess(
                event.getPatient(),
                currentUser
        );

        return mapStoredEventToResponse(event);
    }

    @Transactional
    public CalendarEventResponse createEvent(
            CalendarEventRequest request
    ) {
        User currentUser = getCurrentUser();

        validateEventRequest(request);

        Patient patient = patientRepository
                .findById(request.getPatientId())
                .orElseThrow(() -> new IllegalStateException(
                        "Patient not found."
                ));

        validatePatientAccess(patient, currentUser);

        ProfessionalContact professional =
                getConnectedProfessional(
                        request.getProfessionalContactId(),
                        patient
                );

        CalendarEvent event = new CalendarEvent();

        applyRequestToEvent(
                event,
                request,
                patient,
                professional
        );

        event.setCreatedBy(currentUser);

        CalendarEvent savedEvent =
                calendarEventRepository.save(event);

        return mapStoredEventToResponse(savedEvent);
    }

    @Transactional
    public CalendarEventResponse updateEvent(
            Long eventId,
            CalendarEventRequest request
    ) {
        User currentUser = getCurrentUser();

        validateEventRequest(request);

        CalendarEvent event = calendarEventRepository
                .findById(eventId)
                .orElseThrow(() -> new IllegalStateException(
                        "Calendar event not found."
                ));

        validatePatientAccess(
                event.getPatient(),
                currentUser
        );

        validateManualEventOwnership(
                event,
                currentUser
        );

        if (!event.getPatient()
                .getId()
                .equals(request.getPatientId())) {

            throw new IllegalStateException(
                    "Calendar event cannot be moved to another patient."
            );
        }

        ProfessionalContact professional =
                getConnectedProfessional(
                        request.getProfessionalContactId(),
                        event.getPatient()
                );

        applyRequestToEvent(
                event,
                request,
                event.getPatient(),
                professional
        );

        CalendarEvent updatedEvent =
                calendarEventRepository.save(event);

        return mapStoredEventToResponse(updatedEvent);
    }

    @Transactional
    public void deleteEvent(Long eventId) {

        User currentUser = getCurrentUser();

        CalendarEvent event = calendarEventRepository
                .findById(eventId)
                .orElseThrow(() -> new IllegalStateException(
                        "Calendar event not found."
                ));

        validatePatientAccess(
                event.getPatient(),
                currentUser
        );

        validateManualEventOwnership(
                event,
                currentUser
        );

        calendarEventRepository.delete(event);
    }

    private void applyRequestToEvent(
            CalendarEvent event,
            CalendarEventRequest request,
            Patient patient,
            ProfessionalContact professional
    ) {
        event.setPatient(patient);
        event.setTitle(request.getTitle().trim());

        event.setDescription(
                request.getDescription() != null
                        && !request.getDescription().isBlank()
                        ? request.getDescription().trim()
                        : null
        );

        event.setEventType(request.getEventType());
        event.setStartDateTime(request.getStartDateTime());
        event.setEndDateTime(request.getEndDateTime());

        event.setLocation(
                request.getLocation() != null
                        && !request.getLocation().isBlank()
                        ? request.getLocation().trim()
                        : null
        );

        event.setStatus(
                request.getStatus() != null
                        ? request.getStatus()
                        : CalendarEventStatus.PLANNED
        );

        event.setProfessionalContact(professional);

        event.setReminderEnabled(
                request.isReminderEnabled()
        );

        event.setReminderMinutesBefore(
                request.isReminderEnabled()
                        ? request.getReminderMinutesBefore()
                        : null
        );
    }

    private ProfessionalContact getConnectedProfessional(
            Long professionalContactId,
            Patient patient
    ) {
        if (professionalContactId == null) {
            return null;
        }

        return patientProfessionalContactRepository
                .findByPatientIdAndProfessionalContactId(
                        patient.getId(),
                        professionalContactId
                )
                .map(
                        PatientProfessionalContact
                                ::getProfessionalContact
                )
                .orElseThrow(() -> new IllegalStateException(
                        "The selected professional is not connected to this patient."
                ));
    }

    private void validateManualEventOwnership(
            CalendarEvent event,
            User currentUser
    ) {
        if (event.getAppointmentRequest() != null) {
            throw new IllegalStateException(
                    "Appointment events must be managed through appointment requests."
            );
        }

        if (!event.getCreatedBy()
                .getId()
                .equals(currentUser.getId())) {

            throw new IllegalStateException(
                    "You can only modify calendar events that you created."
            );
        }
    }

    private void validateEventRequest(
            CalendarEventRequest request
    ) {
        if (request == null) {
            throw new IllegalStateException(
                    "Calendar event data are required."
            );
        }

        if (request.getPatientId() == null) {
            throw new IllegalStateException(
                    "Patient is required."
            );
        }

        if (request.getTitle() == null
                || request.getTitle().isBlank()) {

            throw new IllegalStateException(
                    "Calendar event title is required."
            );
        }

        if (request.getTitle().trim().length() > 200) {
            throw new IllegalStateException(
                    "Calendar event title cannot exceed 200 characters."
            );
        }

        if (request.getEventType() == null) {
            throw new IllegalStateException(
                    "Calendar event type is required."
            );
        }

        if (request.getEventType()
                == CalendarEventType.MEDICAL_APPOINTMENT) {

            throw new IllegalStateException(
                    "Medical appointment events are created through appointment requests."
            );
        }

        if (request.getStartDateTime() == null) {
            throw new IllegalStateException(
                    "Calendar event start date and time are required."
            );
        }

        if (request.getEndDateTime() != null
                && !request.getEndDateTime()
                .isAfter(request.getStartDateTime())) {

            throw new IllegalStateException(
                    "Calendar event end must be after its start."
            );
        }

        if (request.getLocation() != null
                && request.getLocation().trim().length() > 255) {

            throw new IllegalStateException(
                    "Calendar event location cannot exceed 255 characters."
            );
        }

        if (request.isReminderEnabled()
                && request.getReminderMinutesBefore() == null) {

            throw new IllegalStateException(
                    "Reminder time is required when reminders are enabled."
            );
        }

        if (request.getReminderMinutesBefore() != null
                && request.getReminderMinutesBefore() < 0) {

            throw new IllegalStateException(
                    "Reminder time cannot be negative."
            );
        }
    }
}