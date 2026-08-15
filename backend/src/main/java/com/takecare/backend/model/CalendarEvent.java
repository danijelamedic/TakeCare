package com.takecare.backend.model;

import com.takecare.backend.model.enums.CalendarEventStatus;
import com.takecare.backend.model.enums.CalendarEventType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CalendarEventType eventType;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    @Column(length = 255)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CalendarEventStatus status;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "patient_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_calendar_event_patient")
    )
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "created_by_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_calendar_event_created_by")
    )
    private User createdBy;

    @ManyToOne
    @JoinColumn(
            name = "professional_contact_id",
            foreignKey = @ForeignKey(name = "fk_calendar_event_professional_contact")
    )
    private ProfessionalContact professionalContact;

    @OneToOne
    @JoinColumn(
            name = "appointment_request_id",
            unique = true,
            foreignKey = @ForeignKey(
                    name = "fk_calendar_event_appointment_request"
            )
    )
    private AppointmentRequest appointmentRequest;

    @Column(nullable = false)
    private boolean reminderEnabled = false;

    private Integer reminderMinutesBefore;

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
            status = CalendarEventStatus.PLANNED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}