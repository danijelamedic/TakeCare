package com.takecare.backend.service;

import com.takecare.backend.dto.diary.DiaryEntryRequest;
import com.takecare.backend.dto.diary.DiaryEntryResponse;
import com.takecare.backend.exception.DiaryAccessDeniedException;
import com.takecare.backend.exception.DiaryEntryNotFoundException;
import com.takecare.backend.exception.PatientNotFoundException;
import com.takecare.backend.model.DiaryEntry;
import com.takecare.backend.model.Patient;
import com.takecare.backend.model.User;
import com.takecare.backend.model.enums.DiaryEntryVisibility;
import com.takecare.backend.repository.DiaryEntryRepository;
import com.takecare.backend.repository.PatientRepository;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaryEntryService {

    private final DiaryEntryRepository diaryEntryRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public DiaryEntryResponse createDiaryEntry(DiaryEntryRequest request) {

        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID " + request.getPatientId() + " not found."
                        )
                );
        validatePatientAccess(patient, currentUser);

        DiaryEntry diaryEntry = new DiaryEntry();

        diaryEntry.setTitle(request.getTitle());
        diaryEntry.setContent(request.getContent());
        diaryEntry.setEntryType(request.getEntryType());
        diaryEntry.setEntryDate(request.getEntryDate());
        diaryEntry.setPatient(patient);
        diaryEntry.setAuthor(currentUser);

        if (currentUser.equals(patient.getSupportCoordinator())) {
            diaryEntry.setVisibility(DiaryEntryVisibility.SHARED);
        } else {
            diaryEntry.setVisibility(
                    request.getVisibility() != null
                            ? request.getVisibility()
                            : DiaryEntryVisibility.SHARED
            );
        }

        DiaryEntry savedEntry = diaryEntryRepository.save(diaryEntry);

        return mapToResponse(savedEntry);
    }

    public List<DiaryEntryResponse> getDiaryEntriesForPatient(Long patientId) {

        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new PatientNotFoundException(
                                "Patient with ID " + patientId + " not found."
                        )
                );

        validatePatientAccess(patient, currentUser);

        boolean isParent =
                patient.getParent() != null &&
                        patient.getParent().getId().equals(currentUser.getId());

        List<DiaryEntry> entries;

        if (isParent) {
            entries =
                    diaryEntryRepository
                            .findByPatientIdOrderByEntryDateDescCreatedAtDesc(patientId);
        } else {
            entries =
                    diaryEntryRepository
                            .findByPatientIdOrderByEntryDateDescCreatedAtDesc(patientId)
                            .stream()
                            .filter(entry ->
                                    entry.getAuthor().getId().equals(currentUser.getId())
                                            ||
                                            entry.getVisibility() == DiaryEntryVisibility.SHARED
                            )
                            .toList();
        }

        return entries.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public DiaryEntryResponse getDiaryEntry(Long diaryEntryId) {

        User currentUser = getCurrentUser();

        DiaryEntry entry = diaryEntryRepository.findById(diaryEntryId)
                .orElseThrow(() ->
                        new DiaryEntryNotFoundException(diaryEntryId)
                );

        validatePatientAccess(entry.getPatient(), currentUser);

        boolean isParent =
                entry.getPatient().getParent() != null &&
                        entry.getPatient().getParent().getId().equals(currentUser.getId());

        boolean isAuthor =
                entry.getAuthor().getId().equals(currentUser.getId());

        if (!isParent
                && !isAuthor
                && entry.getVisibility() != DiaryEntryVisibility.SHARED) {

            throw new DiaryAccessDeniedException();
        }

        return mapToResponse(entry);
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user.");
        }

        String email = authentication.getName();

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new IllegalStateException("Authenticated user not found.")
                );
    }

    private void validatePatientAccess(Patient patient, User user) {

        boolean isParent =
                patient.getParent() != null &&
                        patient.getParent().getId().equals(user.getId());

        boolean isCoordinator =
                patient.getSupportCoordinator() != null &&
                        patient.getSupportCoordinator().getId().equals(user.getId());

        if (!isParent && !isCoordinator) {
            throw new DiaryAccessDeniedException();
        }
    }

    private DiaryEntryResponse mapToResponse(DiaryEntry entry) {

        User author = entry.getAuthor();

        String authorName =
                author.getFirstName() + " " + author.getLastName();

        return DiaryEntryResponse.builder()
                .id(entry.getId())
                .patientId(entry.getPatient().getId())
                .title(entry.getTitle())
                .content(entry.getContent())
                .entryType(entry.getEntryType())
                .entryDate(entry.getEntryDate())
                .authorId(author.getId())
                .authorName(authorName)
                .authorRole(entry.getAuthorRole())
                .visibility(entry.getVisibility())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    public DiaryEntryResponse updateDiaryEntry(
            Long diaryEntryId,
            DiaryEntryRequest request
    ) {

        User currentUser = getCurrentUser();

        DiaryEntry entry = diaryEntryRepository.findById(diaryEntryId)
                .orElseThrow(() ->
                        new DiaryEntryNotFoundException(diaryEntryId)
                );

        validatePatientAccess(entry.getPatient(), currentUser);

        boolean isAuthor =
                entry.getAuthor() != null &&
                        entry.getAuthor().getId().equals(currentUser.getId());

        if (!isAuthor) {
            throw new DiaryAccessDeniedException();
        }

        entry.setTitle(request.getTitle());
        entry.setContent(request.getContent());
        entry.setEntryType(request.getEntryType());
        entry.setEntryDate(request.getEntryDate());

        boolean isCoordinator =
                entry.getPatient().getSupportCoordinator() != null &&
                        entry.getPatient()
                                .getSupportCoordinator()
                                .getId()
                                .equals(currentUser.getId());

        if (isCoordinator) {
            entry.setVisibility(DiaryEntryVisibility.SHARED);
        } else {
            entry.setVisibility(
                    request.getVisibility() != null
                            ? request.getVisibility()
                            : DiaryEntryVisibility.SHARED
            );
        }

        DiaryEntry updatedEntry =
                diaryEntryRepository.save(entry);

        return mapToResponse(updatedEntry);
    }

    public void deleteDiaryEntry(Long diaryEntryId) {

        User currentUser = getCurrentUser();

        DiaryEntry entry = diaryEntryRepository.findById(diaryEntryId)
                .orElseThrow(() ->
                        new DiaryEntryNotFoundException(diaryEntryId)
                );

        validatePatientAccess(entry.getPatient(), currentUser);

        boolean isAuthor =
                entry.getAuthor() != null &&
                        entry.getAuthor().getId().equals(currentUser.getId());

        if (!isAuthor) {
            throw new DiaryAccessDeniedException();
        }

        diaryEntryRepository.delete(entry);
    }
}