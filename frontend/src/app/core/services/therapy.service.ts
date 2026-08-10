import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TherapyIntakeRequest, TherapyIntakeResponse, TherapyRequest, TherapyResponse, TherapyStatus } from '../models/therapy.models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TherapyService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/therapies`;

    createTherapy(request: TherapyRequest): Observable<TherapyResponse> {
        return this.http.post<TherapyResponse>(this.apiUrl, request);
    }

    getPatientTherapies(
        patientId: number,
        status?: TherapyStatus
    ): Observable<TherapyResponse[]> {
        let params = new HttpParams();

        if (status) {
        params = params.set('status', status);
        }

        return this.http.get<TherapyResponse[]>(
        `${this.apiUrl}/patient/${patientId}`,
        { params }
        );
    }

    getTherapyById(therapyId: number): Observable<TherapyResponse> {
        return this.http.get<TherapyResponse>(
        `${this.apiUrl}/${therapyId}`
        );
    }

    updateTherapy(
        therapyId: number,
        request: TherapyRequest
    ): Observable<TherapyResponse> {
        return this.http.put<TherapyResponse>(
        `${this.apiUrl}/${therapyId}`,
        request
        );
    }

    updateTherapyStatus(
        therapyId: number,
        status: TherapyStatus
    ): Observable<TherapyResponse> {
        const params = new HttpParams().set('status', status);

        return this.http.patch<TherapyResponse>(
        `${this.apiUrl}/${therapyId}/status`,
        null,
        { params }
        );
    }

    createIntake(
        therapyId: number,
        request: TherapyIntakeRequest
    ): Observable<TherapyIntakeResponse> {
        return this.http.post<TherapyIntakeResponse>(
        `${this.apiUrl}/${therapyId}/intakes`,
        request
        );
    }

    getTherapyIntakes(
        therapyId: number
    ): Observable<TherapyIntakeResponse[]> {
        return this.http.get<TherapyIntakeResponse[]>(
        `${this.apiUrl}/${therapyId}/intakes`
        );
    }

    updateIntake(
        intakeId: number,
        request: TherapyIntakeRequest
    ): Observable<TherapyIntakeResponse> {
        return this.http.put<TherapyIntakeResponse>(
        `${this.apiUrl}/intakes/${intakeId}`,
        request
        );
    }
}