package com.takecare.backend.controller;

import com.takecare.backend.dto.diary.DiaryEntryRequest;
import com.takecare.backend.dto.diary.DiaryEntryResponse;
import com.takecare.backend.service.DiaryEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryEntryController {

    private final DiaryEntryService diaryEntryService;

    @PostMapping
    public ResponseEntity<DiaryEntryResponse> createDiaryEntry(
            @Valid @RequestBody DiaryEntryRequest request
    ) {

        DiaryEntryResponse response =
                diaryEntryService.createDiaryEntry(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<DiaryEntryResponse>> getDiaryEntriesForPatient(
            @PathVariable Long patientId
    ) {

        List<DiaryEntryResponse> response =
                diaryEntryService.getDiaryEntriesForPatient(patientId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{diaryEntryId}")
    public ResponseEntity<DiaryEntryResponse> getDiaryEntry(
            @PathVariable Long diaryEntryId
    ) {

        DiaryEntryResponse response =
                diaryEntryService.getDiaryEntry(diaryEntryId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{diaryEntryId}")
    public ResponseEntity<DiaryEntryResponse> updateDiaryEntry(
            @PathVariable Long diaryEntryId,
            @Valid @RequestBody DiaryEntryRequest request
    ) {

        DiaryEntryResponse response =
                diaryEntryService.updateDiaryEntry(diaryEntryId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{diaryEntryId}")
    public ResponseEntity<Void> deleteDiaryEntry(
            @PathVariable Long diaryEntryId
    ) {

        diaryEntryService.deleteDiaryEntry(diaryEntryId);

        return ResponseEntity.noContent().build();
    }
}