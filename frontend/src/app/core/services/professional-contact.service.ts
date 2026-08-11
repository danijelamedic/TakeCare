import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    ProfessionalContactResponse
} from '../models/professional-contact.models';

@Injectable({
    providedIn: 'root'
})
export class ProfessionalContactService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiUrl}/professional-contacts`;

    getAllProfessionals():
        Observable<ProfessionalContactResponse[]> {
        return this.http.get<ProfessionalContactResponse[]>(
            this.apiUrl
        );
    }

    getProfessionalsForPatient(
        patientId: number
    ): Observable<ProfessionalContactResponse[]> {
        return this.http.get<ProfessionalContactResponse[]>(
            `${this.apiUrl}/patient/${patientId}`
        );
    }

    getProfessionalDetails(
        contactId: number,
        patientId: number
    ): Observable<ProfessionalContactResponse> {
        return this.http.get<ProfessionalContactResponse>(
            `${this.apiUrl}/${contactId}/patient/${patientId}`
        );
    }

    connectProfessionalToPatient(
        contactId: number,
        patientId: number
    ): Observable<ProfessionalContactResponse> {
        return this.http.post<ProfessionalContactResponse>(
            `${this.apiUrl}/${contactId}/patients/${patientId}`,
            null
        );
    }

    disconnectProfessionalFromPatient(
        contactId: number,
        patientId: number
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${contactId}/patients/${patientId}`
        );
    }
}