import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
    AppointmentRequestResponse,
    CreateAppointmentRequestRequest,
    ProposeAppointmentTimeRequest,
    RejectAppointmentRequest,
    RespondToProposedTimeRequest
} from '../models/appointment-request.models';

@Injectable({
    providedIn: 'root'
})
export class AppointmentRequestService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiUrl}/appointment-requests`;

    createRequest(
        request: CreateAppointmentRequestRequest
    ): Observable<AppointmentRequestResponse> {
        return this.http.post<AppointmentRequestResponse>(
            this.apiUrl,
            request
        );
    }

    getParentRequests():
        Observable<AppointmentRequestResponse[]> {
        return this.http.get<AppointmentRequestResponse[]>(
            `${this.apiUrl}/parent`
        );
    }

    getCoordinatorRequests():
        Observable<AppointmentRequestResponse[]> {
        return this.http.get<AppointmentRequestResponse[]>(
            `${this.apiUrl}/coordinator`
        );
    }

    approveRequest(
        requestId: number
    ): Observable<AppointmentRequestResponse> {
        return this.http.patch<AppointmentRequestResponse>(
            `${this.apiUrl}/${requestId}/approve`,
            null
        );
    }

    rejectRequest(
        requestId: number,
        request: RejectAppointmentRequest
    ): Observable<AppointmentRequestResponse> {
        return this.http.patch<AppointmentRequestResponse>(
            `${this.apiUrl}/${requestId}/reject`,
            request
        );
    }

    proposeNewTime(
        requestId: number,
        request: ProposeAppointmentTimeRequest
    ): Observable<AppointmentRequestResponse> {
        return this.http.patch<AppointmentRequestResponse>(
            `${this.apiUrl}/${requestId}/propose-time`,
            request
        );
    }

    respondToProposedTime(
        requestId: number,
        accepted: boolean
    ): Observable<AppointmentRequestResponse> {
        const request: RespondToProposedTimeRequest = {
            accepted
        };

        return this.http.patch<AppointmentRequestResponse>(
            `${this.apiUrl}/${requestId}/respond`,
            request
        );
    }
}