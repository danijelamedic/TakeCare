package com.takecare.backend.model;

import com.takecare.backend.model.enums.Gender;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Gender gender;

    private String profileImage;

    private String address;

    @Column(length = 150)
    private String emergencyContactName;

    @Column(length = 50)
    private String emergencyContactPhone;

    @Column(length = 20)
    private String bloodType;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String specialNeeds;

    @Column(columnDefinition = "TEXT")
    private String importantInformation;

    @Column(columnDefinition = "TEXT")
    private String generalNotes;

    @OneToOne(optional = false)
    @JoinColumn(
            name = "parent_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_patient_parent")
    )
    private User parent;

    @OneToOne
    @JoinColumn(
            name = "support_coordinator_id",
            unique = true,
            foreignKey = @ForeignKey(name = "fk_patient_support_coordinator")
    )
    private User supportCoordinator;

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