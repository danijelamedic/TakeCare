package com.takecare.backend.repository;

import com.takecare.backend.model.TherapySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TherapyScheduleRepository
        extends JpaRepository<TherapySchedule, Long> {

    List<TherapySchedule> findByTherapyIdOrderByTimeAsc(
            Long therapyId
    );

    void deleteByTherapyId(Long therapyId);

    @Query("""
        SELECT schedule
        FROM TherapySchedule schedule
        JOIN FETCH schedule.therapy therapy
        WHERE therapy.patient.id = :patientId
          AND therapy.status = com.takecare.backend.model.enums.TherapyStatus.ACTIVE
          AND schedule.startDate <= :periodEnd
          AND (
                schedule.endDate IS NULL
                OR schedule.endDate >= :periodStart
          )
          AND therapy.startDate <= :periodEnd
          AND (
                therapy.endDate IS NULL
                OR therapy.endDate >= :periodStart
          )
        ORDER BY schedule.time ASC
        """)
    List<TherapySchedule> findActiveSchedulesInPeriod(
            @Param("patientId") Long patientId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd
    );
}