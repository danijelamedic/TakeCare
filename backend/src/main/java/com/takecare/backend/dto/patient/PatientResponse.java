package com.takecare.backend.dto.patient;

import com.takecare.backend.model.enums.BloodType;
import com.takecare.backend.model.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private LocalDate dateOfBirth;

    private Gender gender;

    private String profileImage;

    private String address;

    private String emergencyContactName;

    private String emergencyContactPhone;

    private BloodType bloodType;

    private String allergies;

    private String specialNeeds;

    private String importantInformation;

    private String generalNotes;

    private Long parentId;

    private Long supportCoordinatorId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}