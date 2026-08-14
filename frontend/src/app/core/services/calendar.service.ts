import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    CalendarEventRequest,
    CalendarEventResponse
} from '../models/calendar.models';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {

    private readonly calendarUrl =
        `${environment.apiUrl}/calendar`;

    constructor(
        private readonly http: HttpClient
    ) {}

    getEvents(
        patientId: number,
        start: string,
        end: string
    ): Observable<CalendarEventResponse[]> {

        const params = new HttpParams()
            .set('patientId', patientId.toString())
            .set('start', start)
            .set('end', end);

        return this.http.get<CalendarEventResponse[]>(
            this.calendarUrl,
            { params }
        );
    }

    getEvent(
        eventId: number
    ): Observable<CalendarEventResponse> {
        return this.http.get<CalendarEventResponse>(
            `${this.calendarUrl}/events/${eventId}`
        );
    }

    createEvent(
        request: CalendarEventRequest
    ): Observable<CalendarEventResponse> {
        return this.http.post<CalendarEventResponse>(
            `${this.calendarUrl}/events`,
            request
        );
    }

    updateEvent(
        eventId: number,
        request: CalendarEventRequest
    ): Observable<CalendarEventResponse> {
        return this.http.put<CalendarEventResponse>(
            `${this.calendarUrl}/events/${eventId}`,
            request
        );
    }

    deleteEvent(
        eventId: number
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.calendarUrl}/events/${eventId}`
        );
    }
}