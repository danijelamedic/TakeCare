package com.takecare.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "therapy_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TherapySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "therapy_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_therapy_schedule_therapy")
    )
    private Therapy therapy;

    @Column(nullable = false)
    private LocalTime time;

    @ElementCollection(targetClass = DayOfWeek.class)
    @CollectionTable(
            name = "therapy_schedule_days",
            joinColumns = @JoinColumn(name = "therapy_schedule_id"),
            foreignKey = @ForeignKey(name = "fk_schedule_days_schedule")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private Set<DayOfWeek> daysOfWeek = new HashSet<>();

    @Column(length = 200)
    private String frequencyDescription;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String instructions;
}