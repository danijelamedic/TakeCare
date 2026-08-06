import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    PatientRequest,
    PatientResponse
} from '../models/patient.models';

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private readonly patientsUrl =
        `${environment.apiUrl}/patients`;

    constructor(private readonly http: HttpClient) {}

    createPatient(
        request: PatientRequest
    ): Observable<PatientResponse> {
        return this.http.post<PatientResponse>(
            this.patientsUrl,
            request
        );
    }

    getCurrentUserPatient(): Observable<PatientResponse> {
        return this.http.get<PatientResponse>(
            `${this.patientsUrl}/me`
        );
    }

    updateCurrentUserPatient(
        request: PatientRequest
    ): Observable<PatientResponse> {
        return this.http.put<PatientResponse>(
            `${this.patientsUrl}/me`,
            request
        );
    }

    getAssignedPatient(): Observable<PatientResponse> {
        return this.http.get<PatientResponse>(
            `${environment.apiUrl}/patients/assigned`
        );
    }
}