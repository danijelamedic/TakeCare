package com.takecare.backend.service;

import com.takecare.backend.dto.appointment.*;
import com.takecare.backend.model.*;
import com.takecare.backend.model.enums.AppointmentRequestStatus;
import com.takecare.backend.model.enums.CalendarEventStatus;
import com.takecare.backend.model.enums.CalendarEventType;
import com.takecare.backend.model.enums.Role;
import com.takecare.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentRequestService {

    private final AppointmentRequestRepository appointmentRequestRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final PatientRepository patientRepository;
    private final PatientProfessionalContactRepository patientProfessionalContactRepository;
    private final UserRepository userRepository;

    @Transactional
    public AppointmentRequestResponse createRequest(
            CreateAppointmentRequestRequest request
    ) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.PARENT) {
            throw new IllegalStateException(
                    "Only a parent can create an appointment request."
            );
        }

        validateCreateRequest(request);

        Patient patient = patientRepository.findByParent(currentUser)
                .orElseThrow(() -> new IllegalStateException(
                        "Create a care profile before requesting an appointment."
                ));

        if (patient.getSupportCoordinator() == null) {
            throw new IllegalStateException(
                    "A support coordinator must be connected before requesting an appointment."
            );
        }

        ProfessionalContact professionalContact =
                patientProfessionalContactRepository
                        .findByPatientIdAndProfessionalContactId(
                                patient.getId(),
                                request.getProfessionalContactId()
                        )
                        .map(
                                PatientProfessionalContact
                                        ::getProfessionalContact
                        )
                        .orElseThrow(() -> new IllegalStateException(
                                "The selected professional is not connected to this patient."
                        ));

        AppointmentRequest appointmentRequest =
                new AppointmentRequest();

        appointmentRequest.setPatient(patient);
        appointmentRequest.setRequestedBy(currentUser);
        appointmentRequest.setProfessionalContact(
                professionalContact
        );
        appointmentRequest.setRequestedDateTime(
                request.getRequestedDateTime()
        );
        appointmentRequest.setReason(
                request.getReason() != null
                        ? request.getReason().trim()
                        : null
        );
        appointmentRequest.setStatus(
                AppointmentRequestStatus.PENDING
        );

        AppointmentRequest savedRequest =
                appointmentRequestRepository.save(
                        appointmentRequest
                );

        return mapToResponse(savedRequest);
    }

    private void validateCreateRequest(
            CreateAppointmentRequestRequest request
    ) {
        if (request.getProfessionalContactId() == null) {
            throw new IllegalStateException(
                    "Professional contact is required."
            );
        }

        if (request.getRequestedDateTime() == null) {
            throw new IllegalStateException(
                    "Requested date and time are required."
            );
        }

        if (!request.getRequestedDateTime()
                .isAfter(LocalDateTime.now())) {

            throw new IllegalStateException(
                    "Requested date and time must be in the future."
            );
        }

        if (request.getReason() == null
                || request.getReason().isBlank()) {

            throw new IllegalStateException(
                    "Appointment reason is required."
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
                .findByEmailIgnoreCase(
                        authentication.getName()
                )
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user not found."
                ));
    }

    private AppointmentRequestResponse mapToResponse(
            AppointmentRequest request
    ) {
        AppointmentRequestResponse response =
                new AppointmentRequestResponse();

        Patient patient = request.getPatient();
        User requestedBy = request.getRequestedBy();
        User processedBy = request.getProcessedBy();

        ProfessionalContact professional =
                request.getProfessionalContact();

        response.setId(request.getId());

        response.setPatientId(patient.getId());
        response.setPatientName(
                patient.getFirstName()
                        + " "
                        + patient.getLastName()
        );

        response.setRequestedById(requestedBy.getId());
        response.setRequestedByName(
                requestedBy.getFirstName()
                        + " "
                        + requestedBy.getLastName()
        );

        response.setProfessionalContactId(
                professional.getId()
        );
        response.setProfessionalName(
                professional.getFirstName()
                        + " "
                        + professional.getLastName()
        );
        response.setProfessionalProfession(
                professional.getProfessionalType() != null
                        ? professional
                        .getProfessionalType()
                        .name()
                        : null
        );

        response.setRequestedDateTime(
                request.getRequestedDateTime()
        );
        response.setProposedDateTime(
                request.getProposedDateTime()
        );

        response.setReason(request.getReason());
        response.setStatus(request.getStatus());
        response.setCoordinatorComment(
                request.getCoordinatorComment()
        );

        response.setProcessedById(
                processedBy != null
                        ? processedBy.getId()
                        : null
        );
        response.setProcessedByName(
                processedBy != null
                        ? processedBy.getFirstName()
                        + " "
                        + processedBy.getLastName()
                        : null
        );

        response.setResolvedAt(request.getResolvedAt());
        response.setCreatedAt(request.getCreatedAt());
        response.setUpdatedAt(request.getUpdatedAt());

        return response;
    }

    @Transactional(readOnly = true)
    public List<AppointmentRequestResponse> getParentRequests() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.PARENT) {
            throw new IllegalStateException(
                    "Only a parent can view their appointment requests."
            );
        }

        Patient patient = patientRepository.findByParent(currentUser)
                .orElseThrow(() -> new IllegalStateException(
                        "Care profile not found."
                ));

        return appointmentRequestRepository
                .findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentRequestResponse> getCoordinatorRequests() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can view received appointment requests."
            );
        }

        return appointmentRequestRepository
                .findByPatientSupportCoordinatorIdOrderByCreatedAtDesc(
                        currentUser.getId()
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public AppointmentRequestResponse approveRequest(Long requestId) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can approve an appointment request."
            );
        }

        AppointmentRequest appointmentRequest =
                appointmentRequestRepository.findById(requestId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Appointment request not found."
                        ));

        if (appointmentRequest.getPatient().getSupportCoordinator() == null
                || !appointmentRequest.getPatient()
                .getSupportCoordinator()
                .getId()
                .equals(currentUser.getId())) {

            throw new IllegalStateException(
                    "You are not assigned to this patient."
            );
        }

        if (appointmentRequest.getStatus()
                != AppointmentRequestStatus.PENDING) {

            throw new IllegalStateException(
                    "Only a pending appointment request can be approved."
            );
        }

        if (!appointmentRequest.getRequestedDateTime()
                .isAfter(LocalDateTime.now())) {

            throw new IllegalStateException(
                    "The requested appointment time has already passed."
            );
        }

        appointmentRequest.setStatus(
                AppointmentRequestStatus.APPROVED
        );
        appointmentRequest.setProcessedBy(currentUser);
        appointmentRequest.setResolvedAt(LocalDateTime.now());

        AppointmentRequest savedRequest =
                appointmentRequestRepository.save(appointmentRequest);

        createCalendarEvent(
                savedRequest,
                savedRequest.getRequestedDateTime()
        );

        return mapToResponse(savedRequest);
    }

    @Transactional
    public AppointmentRequestResponse rejectRequest(
            Long requestId,
            RejectAppointmentRequest request
    ) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can reject an appointment request."
            );
        }

        AppointmentRequest appointmentRequest =
                appointmentRequestRepository.findById(requestId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Appointment request not found."
                        ));

        if (appointmentRequest.getPatient().getSupportCoordinator() == null
                || !appointmentRequest.getPatient()
                .getSupportCoordinator()
                .getId()
                .equals(currentUser.getId())) {

            throw new IllegalStateException(
                    "You are not assigned to this patient."
            );
        }

        if (appointmentRequest.getStatus()
                != AppointmentRequestStatus.PENDING) {

            throw new IllegalStateException(
                    "Only a pending appointment request can be rejected."
            );
        }

        if (request == null
                || request.getCoordinatorComment() == null
                || request.getCoordinatorComment().isBlank()) {

            throw new IllegalStateException(
                    "A rejection reason is required."
            );
        }

        appointmentRequest.setStatus(
                AppointmentRequestStatus.REJECTED
        );
        appointmentRequest.setCoordinatorComment(
                request.getCoordinatorComment().trim()
        );
        appointmentRequest.setProcessedBy(currentUser);
        appointmentRequest.setResolvedAt(LocalDateTime.now());

        AppointmentRequest savedRequest =
                appointmentRequestRepository.save(appointmentRequest);

        return mapToResponse(savedRequest);
    }

    @Transactional
    public AppointmentRequestResponse proposeNewTime(
            Long requestId,
            ProposeAppointmentTimeRequest request
    ) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPPORT_COORDINATOR) {
            throw new IllegalStateException(
                    "Only a support coordinator can propose a new appointment time."
            );
        }

        AppointmentRequest appointmentRequest =
                appointmentRequestRepository.findById(requestId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Appointment request not found."
                        ));

        if (appointmentRequest.getPatient().getSupportCoordinator() == null
                || !appointmentRequest.getPatient()
                .getSupportCoordinator()
                .getId()
                .equals(currentUser.getId())) {

            throw new IllegalStateException(
                    "You are not assigned to this patient."
            );
        }

        if (appointmentRequest.getStatus()
                != AppointmentRequestStatus.PENDING) {

            throw new IllegalStateException(
                    "A new time can only be proposed for a pending appointment request."
            );
        }

        if (request == null || request.getProposedDateTime() == null) {
            throw new IllegalStateException(
                    "Proposed date and time are required."
            );
        }

        if (!request.getProposedDateTime().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException(
                    "Proposed date and time must be in the future."
            );
        }

        if (request.getCoordinatorComment() == null
                || request.getCoordinatorComment().isBlank()) {

            throw new IllegalStateException(
                    "A comment explaining the proposed time is required."
            );
        }

        appointmentRequest.setProposedDateTime(
                request.getProposedDateTime()
        );
        appointmentRequest.setCoordinatorComment(
                request.getCoordinatorComment().trim()
        );
        appointmentRequest.setStatus(
                AppointmentRequestStatus.RESCHEDULE_PROPOSED
        );
        appointmentRequest.setProcessedBy(currentUser);

        AppointmentRequest savedRequest =
                appointmentRequestRepository.save(appointmentRequest);

        return mapToResponse(savedRequest);
    }

    @Transactional
    public AppointmentRequestResponse respondToProposedTime(
            Long requestId,
            RespondToProposedTimeRequest request
    ) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.PARENT) {
            throw new IllegalStateException(
                    "Only a parent can respond to a proposed appointment time."
            );
        }

        AppointmentRequest appointmentRequest =
                appointmentRequestRepository.findById(requestId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Appointment request not found."
                        ));

        if (!appointmentRequest.getRequestedBy()
                .getId()
                .equals(currentUser.getId())) {

            throw new IllegalStateException(
                    "You are not allowed to respond to this appointment request."
            );
        }

        if (appointmentRequest.getStatus()
                != AppointmentRequestStatus.RESCHEDULE_PROPOSED) {

            throw new IllegalStateException(
                    "This appointment request does not have a pending proposed time."
            );
        }

        if (appointmentRequest.getProposedDateTime() == null) {
            throw new IllegalStateException(
                    "Proposed appointment time was not found."
            );
        }

        if (request == null) {
            throw new IllegalStateException(
                    "Parent response is required."
            );
        }

        if (request.isAccepted()
                && !appointmentRequest.getProposedDateTime()
                .isAfter(LocalDateTime.now())) {

            throw new IllegalStateException(
                    "The proposed appointment time has already passed."
            );
        }

        boolean accepted = request.isAccepted();

        appointmentRequest.setStatus(
                accepted
                        ? AppointmentRequestStatus.PARENT_ACCEPTED
                        : AppointmentRequestStatus.PARENT_REJECTED
        );

        appointmentRequest.setResolvedAt(LocalDateTime.now());

        AppointmentRequest savedRequest =
                appointmentRequestRepository.save(appointmentRequest);

        if (accepted) {
            createCalendarEvent(
                    savedRequest,
                    savedRequest.getProposedDateTime()
            );
        }

        return mapToResponse(savedRequest);
    }

    private void createCalendarEvent(
            AppointmentRequest appointmentRequest,
            LocalDateTime appointmentDateTime
    ) {
        if (calendarEventRepository.existsByAppointmentRequestId(
                appointmentRequest.getId()
        )) {
            throw new IllegalStateException(
                    "A calendar event already exists for this appointment request."
            );
        }

        ProfessionalContact professional =
                appointmentRequest.getProfessionalContact();

        CalendarEvent calendarEvent = new CalendarEvent();

        calendarEvent.setPatient(
                appointmentRequest.getPatient()
        );

        calendarEvent.setTitle(
                "Appointment with "
                        + professional.getFirstName()
                        + " "
                        + professional.getLastName()
        );

        calendarEvent.setDescription(
                appointmentRequest.getReason()
        );

        calendarEvent.setEventType(
                CalendarEventType.MEDICAL_APPOINTMENT
        );

        calendarEvent.setStartDateTime(
                appointmentDateTime
        );

        calendarEvent.setEndDateTime(
                appointmentDateTime.plusHours(1)
        );

        calendarEvent.setStatus(
                CalendarEventStatus.CONFIRMED
        );

        calendarEvent.setProfessionalContact(
                professional
        );

        calendarEvent.setAppointmentRequest(
                appointmentRequest
        );

        calendarEvent.setCreatedBy(
                appointmentRequest.getProcessedBy()
        );

        calendarEventRepository.save(calendarEvent);
    }
}