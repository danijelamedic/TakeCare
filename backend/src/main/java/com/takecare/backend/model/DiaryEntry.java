package com.takecare.backend.model;

import com.takecare.backend.model.enums.DiaryEntryType;
import com.takecare.backend.model.enums.DiaryEntryVisibility;
import com.takecare.backend.model.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "diary_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiaryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DiaryEntryType entryType;

    @Column(nullable = false)
    private LocalDate entryDate;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "patient_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_diary_entry_patient")
    )
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "author_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_diary_entry_author")
    )
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role authorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DiaryEntryVisibility visibility;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (entryDate == null) {
            entryDate = LocalDate.now();
        }

        if (visibility == null) {
            visibility = DiaryEntryVisibility.SHARED;
        }

        if (author != null) {
            authorRole = author.getRole();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}