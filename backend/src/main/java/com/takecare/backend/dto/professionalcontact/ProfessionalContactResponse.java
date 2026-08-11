package com.takecare.backend.dto.professionalcontact;

import com.takecare.backend.model.enums.ProfessionalType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalContactResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String fullName;

    private ProfessionalType professionalType;

    private String specialization;

    private String institutionName;

    private String phoneNumber;

    private String email;

    private String address;

    private String workingHours;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}