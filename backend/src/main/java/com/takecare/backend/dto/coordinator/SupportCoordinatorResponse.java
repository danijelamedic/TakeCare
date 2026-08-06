package com.takecare.backend.dto.coordinator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportCoordinatorResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;
}