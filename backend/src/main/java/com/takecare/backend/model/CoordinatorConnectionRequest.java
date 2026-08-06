package com.takecare.backend.model;

import com.takecare.backend.model.enums.CoordinatorConnectionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "coordinator_connection_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoordinatorConnectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "patient_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_connection_request_patient"
            )
    )
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "coordinator_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_connection_request_coordinator"
            )
    )
    private User coordinator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CoordinatorConnectionStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();

        if (status == null) {
            status = CoordinatorConnectionStatus.PENDING;
        }
    }
}