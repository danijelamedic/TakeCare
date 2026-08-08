import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    DiaryEntryRequest,
    DiaryEntryResponse
} from '../models/diary.models';

@Injectable({
    providedIn: 'root'
})
export class DiaryService {

    private readonly diaryUrl = `${environment.apiUrl}/diary`;

    constructor(private readonly http: HttpClient) {}

    createDiaryEntry(
        request: DiaryEntryRequest
    ): Observable<DiaryEntryResponse> {
        return this.http.post<DiaryEntryResponse>(
            this.diaryUrl,
            request
        );
    }

    getDiaryEntriesForPatient(
        patientId: number
    ): Observable<DiaryEntryResponse[]> {
        return this.http.get<DiaryEntryResponse[]>(
            `${this.diaryUrl}/patient/${patientId}`
        );
    }

    getDiaryEntry(
        diaryEntryId: number
    ): Observable<DiaryEntryResponse> {
        return this.http.get<DiaryEntryResponse>(
            `${this.diaryUrl}/${diaryEntryId}`
        );
    }

    updateDiaryEntry(
        diaryEntryId: number,
        request: DiaryEntryRequest
    ): Observable<DiaryEntryResponse> {
        return this.http.put<DiaryEntryResponse>(
            `${this.diaryUrl}/${diaryEntryId}`,
            request
        );
    }

    deleteDiaryEntry(
        diaryEntryId: number
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.diaryUrl}/${diaryEntryId}`
        );
    }
}