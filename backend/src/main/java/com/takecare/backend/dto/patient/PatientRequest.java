package com.takecare.backend.dto.patient;

import com.takecare.backend.model.enums.BloodType;
import com.takecare.backend.model.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
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
    private String chronicDiseases;
    private String diagnoses;
}