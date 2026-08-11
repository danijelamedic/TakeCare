package com.takecare.backend.model;

import com.takecare.backend.model.enums.ProfessionalType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "professional_contacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProfessionalType professionalType;

    @Column(length = 150)
    private String specialization;

    @Column(length = 200)
    private String institutionName;

    @Column(length = 50)
    private String phoneNumber;

    @Column(length = 255)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String workingHours;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}