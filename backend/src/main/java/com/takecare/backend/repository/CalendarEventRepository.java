package com.takecare.backend.repository;

import com.takecare.backend.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CalendarEventRepository
        extends JpaRepository<CalendarEvent, Long> {

    boolean existsByAppointmentRequestId(
            Long appointmentRequestId
    );

    Optional<CalendarEvent> findByIdAndPatientId(
            Long eventId,
            Long patientId
    );

    @Query("""
            SELECT event
            FROM CalendarEvent event
            WHERE event.patient.id = :patientId
              AND event.startDateTime < :periodEnd
              AND (
                    event.endDateTime IS NULL
                    OR event.endDateTime >= :periodStart
              )
            ORDER BY event.startDateTime ASC
            """)
    List<CalendarEvent> findEventsInPeriod(
            @Param("patientId") Long patientId,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );
}