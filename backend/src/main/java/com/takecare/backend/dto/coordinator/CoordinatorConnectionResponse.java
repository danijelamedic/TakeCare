package com.takecare.backend.dto.coordinator;

import com.takecare.backend.model.enums.CoordinatorConnectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoordinatorConnectionResponse {

    private Long id;

    private Long patientId;

    private String patientFirstName;

    private String patientLastName;

    private Long coordinatorId;

    private String coordinatorFirstName;

    private String coordinatorLastName;

    private String coordinatorEmail;

    private CoordinatorConnectionStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime respondedAt;
}