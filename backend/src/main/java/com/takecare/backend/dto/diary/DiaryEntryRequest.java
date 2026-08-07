package com.takecare.backend.dto.diary;

import com.takecare.backend.model.enums.DiaryEntryType;
import com.takecare.backend.model.enums.DiaryEntryVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DiaryEntryRequest {

    @NotNull(message = "Patient is required.")
    private Long patientId;

    @NotBlank(message = "Title is required.")
    @Size(max = 200, message = "Title cannot exceed 200 characters.")
    private String title;

    @NotBlank(message = "Content is required.")
    private String content;

    @NotNull(message = "Entry type is required.")
    private DiaryEntryType entryType;

    private LocalDate entryDate;

    private DiaryEntryVisibility visibility;

}