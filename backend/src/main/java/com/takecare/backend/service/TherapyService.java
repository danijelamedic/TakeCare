package com.takecare.backend.service;

import com.takecare.backend.dto.therapy.*;
import com.takecare.backend.exception.*;
import com.takecare.backend.model.*;
import com.takecare.backend.model.enums.TherapyIntakeStatus;
import com.takecare.backend.model.enums.TherapyStatus;
import com.takecare.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TherapyService {

    private final TherapyRepository therapyRepository;
    private final TherapyScheduleRepository therapyScheduleRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalContactRepository professionalContactRepository;
    private final PatientProfessionalContactRepository patientProfessionalContactRepository;
    private final UserRepository userRepository;
    private final TherapyIntakeRepository therapyIntakeRepository;

    @Transactional
    public TherapyResponse createTherapy(TherapyRequest request) {

        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID "
                                        + request.getPatientId()
                                        + " not found."
                        )
                );

        validatePatientAccess(patient, currentUser);
        validateTherapyRequest(request);

        ProfessionalContact prescribedBy =
                getPrescribedBy(request.getPrescribedById(), patient);

        Therapy therapy = new Therapy();

        applyRequestToTherapy(
                therapy,
                request,
                patient,
                prescribedBy
        );

        therapy.setCreatedBy(currentUser);

        Therapy savedTherapy = therapyRepository.save(therapy);

        saveSchedules(savedTherapy, request.getSchedules());

        return mapToResponse(savedTherapy);
    }

    @Transactional(readOnly = true)
    public List<TherapyResponse> getTherapiesForPatient(
            Long patientId,
            TherapyStatus status
    ) {
        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID "
                                        + patientId
                                        + " not found."
                        )
                );

        validatePatientAccess(patient, currentUser);

        List<Therapy> therapies;

        if (status == null) {
            therapies =
                    therapyRepository
                            .findByPatientIdOrderByStartDateDescCreatedAtDesc(
                                    patientId
                            );
        } else {
            therapies =
                    therapyRepository
                            .findByPatientIdAndStatusOrderByStartDateDescCreatedAtDesc(
                                    patientId,
                                    status
                            );
        }

        return therapies.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TherapyResponse getTherapy(Long therapyId) {

        User currentUser = getCurrentUser();

        Therapy therapy = therapyRepository.findById(therapyId)
                .orElseThrow(() ->
                        new TherapyNotFoundException(therapyId)
                );

        validatePatientAccess(therapy.getPatient(), currentUser);

        return mapToResponse(therapy);
    }

    @Transactional
    public TherapyResponse updateTherapy(
            Long therapyId,
            TherapyRequest request
    ) {
        User currentUser = getCurrentUser();

        Therapy therapy = therapyRepository.findById(therapyId)
                .orElseThrow(() ->
                        new TherapyNotFoundException(therapyId)
                );

        validatePatientAccess(
                therapy.getPatient(),
                currentUser
        );

        if (!therapy.getPatient()
                .getId()
                .equals(request.getPatientId())) {

            throw new InvalidTherapyDataException(
                    "Therapy cannot be moved to another patient."
            );
        }

        validateTherapyRequest(request);

        ProfessionalContact prescribedBy =
                getPrescribedBy(
                        request.getPrescribedById(),
                        therapy.getPatient()
                );

        applyRequestToTherapy(
                therapy,
                request,
                therapy.getPatient(),
                prescribedBy
        );

        Therapy updatedTherapy =
                therapyRepository.save(therapy);

        therapyScheduleRepository.deleteByTherapyId(
                therapyId
        );

        therapyScheduleRepository.flush();

        saveSchedules(
                updatedTherapy,
                request.getSchedules()
        );

        return mapToResponse(updatedTherapy);
    }


    @Transactional
    public TherapyResponse updateTherapyStatus(
            Long therapyId,
            TherapyStatus status
    ) {
        if (status == null) {
            throw new InvalidTherapyDataException(
                    "Therapy status is required."
            );
        }

        User currentUser = getCurrentUser();

        Therapy therapy = therapyRepository.findById(therapyId)
                .orElseThrow(() ->
                        new TherapyNotFoundException(therapyId)
                );

        validatePatientAccess(
                therapy.getPatient(),
                currentUser
        );

        therapy.setStatus(status);

        if (status == TherapyStatus.COMPLETED
                && therapy.getEndDate() == null) {

            therapy.setEndDate(LocalDate.now());
        }

        Therapy updatedTherapy =
                therapyRepository.save(therapy);

        return mapToResponse(updatedTherapy);
    }

    private void applyRequestToTherapy(
            Therapy therapy,
            TherapyRequest request,
            Patient patient,
            ProfessionalContact prescribedBy
    ) {
        therapy.setName(request.getName().trim());
        therapy.setDescription(request.getDescription());
        therapy.setDosage(request.getDosage());
        therapy.setFrequency(request.getFrequency());
        therapy.setInstructions(request.getInstructions());
        therapy.setStartDate(request.getStartDate());
        therapy.setEndDate(request.getEndDate());
        therapy.setStatus(
                request.getStatus() != null
                        ? request.getStatus()
                        : TherapyStatus.ACTIVE
        );
        therapy.setPrescribedBy(prescribedBy);
        therapy.setNotes(request.getNotes());
        therapy.setPatient(patient);
    }

    private void saveSchedules(
            Therapy therapy,
            List<TherapyScheduleRequest> scheduleRequests
    ) {
        List<TherapySchedule> schedules =
                scheduleRequests.stream()
                        .map(request -> {
                            TherapySchedule schedule =
                                    new TherapySchedule();

                            schedule.setTherapy(therapy);
                            schedule.setTime(request.getTime());
                            schedule.setDaysOfWeek(
                                    new HashSet<>(
                                            request.getDaysOfWeek()
                                    )
                            );
                            schedule.setFrequencyDescription(
                                    request.getFrequencyDescription()
                            );
                            schedule.setStartDate(
                                    request.getStartDate()
                            );
                            schedule.setEndDate(
                                    request.getEndDate()
                            );
                            schedule.setInstructions(
                                    request.getInstructions()
                            );

                            return schedule;
                        })
                        .toList();

        therapyScheduleRepository.saveAll(schedules);
    }

    private ProfessionalContact getPrescribedBy(
            Long prescribedById,
            Patient patient
    ) {
        if (prescribedById == null) {
            return null;
        }

        return patientProfessionalContactRepository
                .findByPatientIdAndProfessionalContactId(
                        patient.getId(),
                        prescribedById
                )
                .map(PatientProfessionalContact::getProfessionalContact)
                .orElseThrow(() ->
                        new ProfessionalContactNotFoundException(
                                prescribedById
                        )
                );
    }

    private void validateTherapyRequest(TherapyRequest request) {

        if (request.getEndDate() != null
                && request.getEndDate()
                .isBefore(request.getStartDate())) {

            throw new InvalidTherapyDataException(
                    "Therapy end date cannot be before start date."
            );
        }

        for (TherapyScheduleRequest schedule : request.getSchedules()) {

            if (schedule.getEndDate() != null
                    && schedule.getEndDate()
                    .isBefore(schedule.getStartDate())) {

                throw new InvalidTherapyDataException(
                        "Schedule end date cannot be before start date."
                );
            }

            if (schedule.getStartDate()
                    .isBefore(request.getStartDate())) {

                throw new InvalidTherapyDataException(
                        "Schedule cannot start before the therapy."
                );
            }

            if (request.getEndDate() != null
                    && (schedule.getEndDate() == null
                    || schedule.getEndDate()
                    .isAfter(request.getEndDate()))) {

                throw new InvalidTherapyDataException(
                        "Schedule cannot end after the therapy."
                );
            }
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
            throw new TherapyAccessDeniedException();
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
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found."
                        )
                );
    }

    private TherapyResponse mapToResponse(Therapy therapy) {

        User creator = therapy.getCreatedBy();
        ProfessionalContact prescribedBy =
                therapy.getPrescribedBy();

        List<TherapyScheduleResponse> schedules =
                therapyScheduleRepository
                        .findByTherapyIdOrderByTimeAsc(
                                therapy.getId()
                        )
                        .stream()
                        .map(this::mapScheduleToResponse)
                        .toList();

        String creatorName =
                creator.getFirstName()
                        + " "
                        + creator.getLastName();

        String prescribedByName =
                prescribedBy != null
                        ? prescribedBy.getFirstName()
                        + " "
                        + prescribedBy.getLastName()
                        : null;

        return TherapyResponse.builder()
                .id(therapy.getId())
                .patientId(therapy.getPatient().getId())
                .name(therapy.getName())
                .description(therapy.getDescription())
                .dosage(therapy.getDosage())
                .frequency(therapy.getFrequency())
                .instructions(therapy.getInstructions())
                .startDate(therapy.getStartDate())
                .endDate(therapy.getEndDate())
                .status(therapy.getStatus())
                .prescribedById(
                        prescribedBy != null
                                ? prescribedBy.getId()
                                : null
                )
                .prescribedByName(prescribedByName)
                .prescribedByProfession(
                        prescribedBy != null
                                && prescribedBy.getProfessionalType() != null
                                ? prescribedBy.getProfessionalType().name()
                                : null
                )
                .createdById(creator.getId())
                .createdByName(creatorName)
                .createdByRole(creator.getRole())
                .notes(therapy.getNotes())
                .schedules(schedules)
                .createdAt(therapy.getCreatedAt())
                .updatedAt(therapy.getUpdatedAt())
                .build();
    }

    private TherapyScheduleResponse mapScheduleToResponse(
            TherapySchedule schedule
    ) {
        return TherapyScheduleResponse.builder()
                .id(schedule.getId())
                .time(schedule.getTime())
                .daysOfWeek(
                        new HashSet<>(
                                schedule.getDaysOfWeek()
                        )
                )
                .frequencyDescription(
                        schedule.getFrequencyDescription()
                )
                .startDate(schedule.getStartDate())
                .endDate(schedule.getEndDate())
                .instructions(schedule.getInstructions())
                .build();
    }

    @Transactional
    public TherapyIntakeResponse recordTherapyIntake(
            Long therapyId,
            TherapyIntakeRequest request
    ) {
        User currentUser = getCurrentUser();

        Therapy therapy = therapyRepository.findById(therapyId)
                .orElseThrow(() ->
                        new TherapyNotFoundException(therapyId)
                );

        validatePatientAccess(
                therapy.getPatient(),
                currentUser
        );

        validateIntakeDate(therapy, request.getScheduledAt());

        if (therapyIntakeRepository
                .findByTherapyIdAndScheduledAt(
                        therapyId,
                        request.getScheduledAt()
                )
                .isPresent()) {

            throw new TherapyIntakeAlreadyRecordedException(
                    therapyId,
                    request.getScheduledAt()
            );
        }

        TherapyIntake intake = new TherapyIntake();

        intake.setTherapy(therapy);
        intake.setScheduledAt(request.getScheduledAt());
        intake.setStatus(request.getStatus());
        intake.setNotes(request.getNotes());
        intake.setRecordedBy(currentUser);

        if (request.getStatus() == TherapyIntakeStatus.TAKEN) {
            intake.setTakenAt(
                    request.getTakenAt() != null
                            ? request.getTakenAt()
                            : LocalDateTime.now()
            );
        } else {
            intake.setTakenAt(null);
        }

        TherapyIntake savedIntake =
                therapyIntakeRepository.save(intake);

        return mapIntakeToResponse(savedIntake);
    }

    @Transactional(readOnly = true)
    public List<TherapyIntakeResponse> getIntakesForTherapy(
            Long therapyId
    ) {
        User currentUser = getCurrentUser();

        Therapy therapy = therapyRepository.findById(therapyId)
                .orElseThrow(() ->
                        new TherapyNotFoundException(therapyId)
                );

        validatePatientAccess(
                therapy.getPatient(),
                currentUser
        );

        return therapyIntakeRepository
                .findByTherapyIdOrderByScheduledAtDesc(therapyId)
                .stream()
                .map(this::mapIntakeToResponse)
                .toList();
    }

    @Transactional
    public TherapyIntakeResponse updateTherapyIntake(
            Long intakeId,
            TherapyIntakeRequest request
    ) {
        User currentUser = getCurrentUser();

        TherapyIntake intake =
                therapyIntakeRepository.findById(intakeId)
                        .orElseThrow(() ->
                                new TherapyIntakeNotFoundException(
                                        intakeId
                                )
                        );

        Therapy therapy = intake.getTherapy();

        validatePatientAccess(
                therapy.getPatient(),
                currentUser
        );

        validateIntakeDate(
                therapy,
                request.getScheduledAt()
        );

        therapyIntakeRepository
                .findByTherapyIdAndScheduledAt(
                        therapy.getId(),
                        request.getScheduledAt()
                )
                .filter(existing ->
                        !existing.getId().equals(intakeId)
                )
                .ifPresent(existing -> {
                    throw new TherapyIntakeAlreadyRecordedException(
                            therapy.getId(),
                            request.getScheduledAt()
                    );
                });

        intake.setScheduledAt(request.getScheduledAt());
        intake.setStatus(request.getStatus());
        intake.setNotes(request.getNotes());

        if (request.getStatus() == TherapyIntakeStatus.TAKEN) {
            intake.setTakenAt(
                    request.getTakenAt() != null
                            ? request.getTakenAt()
                            : LocalDateTime.now()
            );
        } else {
            intake.setTakenAt(null);
        }

        TherapyIntake updatedIntake =
                therapyIntakeRepository.save(intake);

        return mapIntakeToResponse(updatedIntake);
    }

    private void validateIntakeDate(
            Therapy therapy,
            LocalDateTime scheduledAt
    ) {
        if (scheduledAt.toLocalDate()
                .isBefore(therapy.getStartDate())) {

            throw new InvalidTherapyDataException(
                    "Intake cannot be recorded before therapy start date."
            );
        }

        if (therapy.getEndDate() != null
                && scheduledAt.toLocalDate()
                .isAfter(therapy.getEndDate())) {

            throw new InvalidTherapyDataException(
                    "Intake cannot be recorded after therapy end date."
            );
        }
    }

    private TherapyIntakeResponse mapIntakeToResponse(
            TherapyIntake intake
    ) {
        User recordedBy = intake.getRecordedBy();
        Therapy therapy = intake.getTherapy();

        String recordedByName =
                recordedBy.getFirstName()
                        + " "
                        + recordedBy.getLastName();

        return TherapyIntakeResponse.builder()
                .id(intake.getId())
                .therapyId(therapy.getId())
                .therapyName(therapy.getName())
                .patientId(therapy.getPatient().getId())
                .scheduledAt(intake.getScheduledAt())
                .status(intake.getStatus())
                .takenAt(intake.getTakenAt())
                .notes(intake.getNotes())
                .recordedById(recordedBy.getId())
                .recordedByName(recordedByName)
                .recordedByRole(recordedBy.getRole())
                .createdAt(intake.getCreatedAt())
                .updatedAt(intake.getUpdatedAt())
                .build();
    }
}