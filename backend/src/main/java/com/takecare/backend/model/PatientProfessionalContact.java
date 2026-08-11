package com.takecare.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "patient_professional_contacts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_patient_professional_contact",
                        columnNames = {"patient_id", "professional_contact_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfessionalContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "patient_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_patient_professional_contact_patient"
            )
    )
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "professional_contact_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_patient_professional_contact_professional"
            )
    )
    private ProfessionalContact professionalContact;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "linked_by_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_patient_professional_contact_linked_by"
            )
    )
    private User linkedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime linkedAt;

    @PrePersist
    protected void onCreate() {
        linkedAt = LocalDateTime.now();
    }
}