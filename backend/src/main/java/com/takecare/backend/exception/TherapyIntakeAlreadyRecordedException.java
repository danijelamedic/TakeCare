package com.takecare.backend.exception;

import java.time.LocalDateTime;

public class TherapyIntakeAlreadyRecordedException
        extends RuntimeException {

    public TherapyIntakeAlreadyRecordedException(
            Long therapyId,
            LocalDateTime scheduledAt
    ) {
        super(
                "Intake for therapy with ID "
                        + therapyId
                        + " at "
                        + scheduledAt
                        + " has already been recorded."
        );
    }
}