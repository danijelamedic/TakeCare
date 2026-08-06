package com.takecare.backend.dto.coordinator;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoordinatorConnectionCreateRequest {

    @NotNull(message = "Coordinator is required")
    private Long coordinatorId;
}