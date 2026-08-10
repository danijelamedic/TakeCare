package com.takecare.backend.model;

import com.takecare.backend.model.enums.TherapyIntakeStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "therapy_intakes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_therapy_intake_scheduled",
                        columnNames = {"therapy_id", "scheduled_at"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TherapyIntake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "therapy_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_intake_therapy")
    )
    private Therapy therapy;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TherapyIntakeStatus status;

    /*
     * Vreme kada je lek stvarno uzet.
     * Ostaje null kada je doza označena kao SKIPPED.
     */
    private LocalDateTime takenAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "recorded_by_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_intake_recorded_by")
    )
    private User recordedBy;

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