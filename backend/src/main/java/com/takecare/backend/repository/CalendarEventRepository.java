package com.takecare.backend.repository;

import com.takecare.backend.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarEventRepository
        extends JpaRepository<CalendarEvent, Long> {

    boolean existsByAppointmentRequestId(Long appointmentRequestId);
}