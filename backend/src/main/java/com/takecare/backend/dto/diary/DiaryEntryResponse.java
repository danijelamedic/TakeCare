package com.takecare.backend.dto.diary;

import com.takecare.backend.model.enums.DiaryEntryType;
import com.takecare.backend.model.enums.DiaryEntryVisibility;
import com.takecare.backend.model.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class DiaryEntryResponse {

    private Long id;

    private Long patientId;

    private String title;

    private String content;

    private DiaryEntryType entryType;

    private LocalDate entryDate;

    private Long authorId;

    private String authorName;

    private Role authorRole;

    private DiaryEntryVisibility visibility;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}