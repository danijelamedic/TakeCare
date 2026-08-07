import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CoordinatorResponse, CreateCoordinatorConnectionRequest,CoordinatorConnectionResponse } from '../models/coordinator.models';

@Injectable({
    providedIn: 'root'
})
export class CoordinatorService {
    private readonly api =
        `${environment.apiUrl}/support-coordinators`;

    constructor(
        private readonly http: HttpClient
    ) {}

    getAvailable(): Observable<CoordinatorResponse[]> {
        return this.http.get<CoordinatorResponse[]>(
            `${this.api}/available`
        );
    }

    sendRequest(
        request: CreateCoordinatorConnectionRequest
    ): Observable<unknown> {
        return this.http.post(
            `${environment.apiUrl}/coordinator-connections`,
            request
        );
    }

    getPendingRequests(): Observable<CoordinatorConnectionResponse[]> {
        return this.http.get<CoordinatorConnectionResponse[]>(
            `${environment.apiUrl}/coordinator-connections/pending`
        );
    }

    acceptRequest(
        requestId: number
    ): Observable<CoordinatorConnectionResponse> {
        return this.http.patch<CoordinatorConnectionResponse>(
            `${environment.apiUrl}/coordinator-connections/${requestId}/accept`,
            {}
        );
    }

    declineRequest(
        requestId: number
    ): Observable<CoordinatorConnectionResponse> {
        return this.http.patch<CoordinatorConnectionResponse>(
            `${environment.apiUrl}/coordinator-connections/${requestId}/decline`,
            {}
        );
    }

    getAssignedCoordinator():
        Observable<CoordinatorResponse> {
        return this.http.get<CoordinatorResponse>(
            `${this.api}/assigned`
        );
    }
}