package com.takecare.backend.model;

import com.takecare.backend.model.enums.AppointmentRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime requestedDateTime;

    private LocalDateTime proposedDateTime;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentRequestStatus status;

    @Column(columnDefinition = "TEXT")
    private String coordinatorComment;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "patient_id",
            foreignKey = @ForeignKey(name = "fk_appointment_request_patient")
    )
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "requested_by_id",
            foreignKey = @ForeignKey(name = "fk_appointment_request_requested_by")
    )
    private User requestedBy;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "professional_contact_id",
            foreignKey = @ForeignKey(name = "fk_appointment_request_professional")
    )
    private ProfessionalContact professionalContact;

    @ManyToOne
    @JoinColumn(
            name = "processed_by_id",
            foreignKey = @ForeignKey(name = "fk_appointment_request_processed_by")
    )
    private User processedBy;

    private LocalDateTime resolvedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = AppointmentRequestStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}