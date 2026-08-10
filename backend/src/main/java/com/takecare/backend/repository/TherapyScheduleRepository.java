package com.takecare.backend.repository;

import com.takecare.backend.model.TherapySchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TherapyScheduleRepository
        extends JpaRepository<TherapySchedule, Long> {

    List<TherapySchedule> findByTherapyIdOrderByTimeAsc(
            Long therapyId
    );

    void deleteByTherapyId(Long therapyId);
}