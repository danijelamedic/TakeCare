import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of } from 'rxjs';

import { AppointmentRequestResponse } from '../../core/models/appointment-request.models';
import { CalendarEventResponse, CalendarEventType } from '../../core/models/calendar.models';
import { CoordinatorConnectionResponse } from '../../core/models/coordinator.models';
import { DiaryEntryResponse } from '../../core/models/diary.models';
import { PatientResponse } from '../../core/models/patient.models';
import { TherapyIntakeResponse, TherapyResponse } from '../../core/models/therapy.models';

import { AppointmentRequestService } from '../../core/services/appointment-request.service';
import { AuthService } from '../../core/services/auth.service';
import { CalendarService } from '../../core/services/calendar.service';
import { CoordinatorService } from '../../core/services/coordinator.service';
import { DiaryService } from '../../core/services/diary.service';
import { PatientService } from '../../core/services/patient.service';
import { TherapyService } from '../../core/services/therapy.service';

interface CalendarDay {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasEvents: boolean;
}

interface RecentActivityItem {
    id: string;
    title: string;
    description: string;
    date: string;
    type:
        | 'DIARY'
        | 'THERAPY'
        | 'INTAKE'
        | 'APPOINTMENT';
}

@Component({
    selector: 'app-coordinator-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './coordinator-home.html',
    styleUrl: './coordinator-home.scss'
})
export class CoordinatorHome implements OnInit {

    assignedPatient: PatientResponse | null = null;
    pendingRequests: CoordinatorConnectionResponse[] = [];

    displayedMonth = this.startOfMonth(new Date());
    selectedDate = this.startOfDay(new Date());

    calendarDays: CalendarDay[] = [];
    calendarEvents: CalendarEventResponse[] = [];

    therapies: TherapyResponse[] = [];
    therapyIntakes: TherapyIntakeResponse[] = [];
    diaryEntries: DiaryEntryResponse[] = [];
    appointmentRequests: AppointmentRequestResponse[] = [];

    recentActivity: RecentActivityItem[] = [];

    isLoading = true;
    isScheduleLoading = false;
    errorMessage = '';

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly coordinatorService: CoordinatorService,
        private readonly calendarService: CalendarService,
        private readonly therapyService: TherapyService,
        private readonly diaryService: DiaryService,
        private readonly appointmentRequestService:
            AppointmentRequestService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadCoordinatorState();
    }

    get firstName(): string {
        return (
            this.authService.getCurrentUser()?.firstName ||
            'there'
        );
    }

    get monthLabel(): string {
        return this.displayedMonth.toLocaleDateString(
            'en-US',
            {
                month: 'long',
                year: 'numeric'
            }
        );
    }

    get selectedDateLabel(): string {
        if (this.isSelectedDateToday) {
            return "Today's schedule";
        }

        return this.selectedDate.toLocaleDateString(
            'en-US',
            {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            }
        );
    }

    get isSelectedDateToday(): boolean {
        return this.isSameDay(
            this.selectedDate,
            new Date()
        );
    }

    get selectedDateEvents(): CalendarEventResponse[] {
        return this.calendarEvents
            .filter(event =>
                this.isSameDay(
                    new Date(event.startDateTime),
                    this.selectedDate
                )
            )
            .filter(event =>
                event.status !== 'CANCELLED'
            )
            .sort(
                (first, second) =>
                    new Date(
                        first.startDateTime
                    ).getTime() -
                    new Date(
                        second.startDateTime
                    ).getTime()
            );
    }

    loadCoordinatorState(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.assignedPatient = null;
        this.pendingRequests = [];

        this.patientService
            .getAssignedPatient()
            .subscribe({
                next: patient => {
                    this.assignedPatient = patient;
                    this.loadDashboardData(patient.id);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.loadPendingConnectionRequests();
                        return;
                    }

                    this.isLoading = false;
                    this.handleError(error);
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    previousMonth(): void {
        this.displayedMonth = new Date(
            this.displayedMonth.getFullYear(),
            this.displayedMonth.getMonth() - 1,
            1
        );

        this.loadCalendarMonth();
    }

    nextMonth(): void {
        this.displayedMonth = new Date(
            this.displayedMonth.getFullYear(),
            this.displayedMonth.getMonth() + 1,
            1
        );

        this.loadCalendarMonth();
    }

    selectDate(day: CalendarDay): void {
        this.selectedDate = this.startOfDay(day.date);

        if (!day.isCurrentMonth) {
            this.displayedMonth =
                this.startOfMonth(day.date);

            this.loadCalendarMonth();
        }
    }

    isSelectedDay(day: CalendarDay): boolean {
        return this.isSameDay(
            day.date,
            this.selectedDate
        );
    }

    returnToToday(): void {
        const today = this.startOfDay(new Date());

        this.selectedDate = today;
        this.displayedMonth = this.startOfMonth(today);

        this.loadCalendarMonth();
    }

    eventTime(event: CalendarEventResponse): string {
        return new Date(
            event.startDateTime
        ).toLocaleTimeString(
            'en-US',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );
    }

    eventTypeLabel(
        event: CalendarEventResponse
    ): string {
        switch (event.eventType) {
            case CalendarEventType.MEDICAL_APPOINTMENT:
                return 'Appointment';

            case CalendarEventType.THERAPY_SESSION:
                return 'Therapy';

            case CalendarEventType.MEDICATION:
                return 'Medication';

            case CalendarEventType.CONSULTATION:
                return 'Consultation';

            case CalendarEventType.SUPPORT_MEETING:
                return 'Support meeting';

            case CalendarEventType.SCHOOL_EVENT:
                return 'School event';

            case CalendarEventType.REMINDER:
                return 'Reminder';

            case CalendarEventType.PERSONAL:
                return 'Personal';

            default:
                return 'Other';
        }
    }

    isTherapyEvent(
        event: CalendarEventResponse
    ): boolean {
        return (
            event.generatedFromTherapy &&
            event.therapyId !== null
        );
    }

    getIntakeForEvent(
        event: CalendarEventResponse
    ): TherapyIntakeResponse | null {
        if (!event.therapyId) {
            return null;
        }

        return (
            this.therapyIntakes.find(intake =>
                intake.therapyId === event.therapyId &&
                this.isSameMinute(
                    new Date(intake.scheduledAt),
                    new Date(event.startDateTime)
                )
            ) ||
            null
        );
    }

    isTherapyTaken(
        event: CalendarEventResponse
    ): boolean {
        return (
            this.getIntakeForEvent(event)?.status ===
            'TAKEN'
        );
    }

    isTherapySkipped(
        event: CalendarEventResponse
    ): boolean {
        return (
            this.getIntakeForEvent(event)?.status ===
            'SKIPPED'
        );
    }

    trackCalendarDay(
        _index: number,
        day: CalendarDay
    ): string {
        return this.toDateKey(day.date);
    }

    trackEvent(
        _index: number,
        event: CalendarEventResponse
    ): string {
        return [
            event.id ?? 'generated',
            event.therapyId ?? 'event',
            event.startDateTime
        ].join('-');
    }

    trackActivity(
        _index: number,
        activity: RecentActivityItem
    ): string {
        return activity.id;
    }

    private loadDashboardData(
        patientId: number
    ): void {
        const range = this.getCalendarRange();

        forkJoin({
            events: this.calendarService
                .getEvents(
                    patientId,
                    range.start,
                    range.end
                )
                .pipe(catchError(() => of([]))),

            therapies: this.therapyService
                .getPatientTherapies(patientId)
                .pipe(catchError(() => of([]))),

            diaryEntries: this.diaryService
                .getDiaryEntriesForPatient(patientId)
                .pipe(catchError(() => of([]))),

            appointmentRequests:
                this.appointmentRequestService
                    .getCoordinatorRequests()
                    .pipe(catchError(() => of([])))
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: result => {
                    this.calendarEvents = result.events;
                    this.therapies = result.therapies;
                    this.diaryEntries = result.diaryEntries;
                    this.appointmentRequests =
                        result.appointmentRequests;

                    this.buildCalendarDays();
                    this.loadTherapyIntakes();
                    this.buildRecentActivity();
                },
                error: (error: HttpErrorResponse) => {
                    this.handleError(error);
                }
            });
    }

    private loadPendingConnectionRequests(): void {
        this.coordinatorService
            .getPendingRequests()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: requests => {
                    this.pendingRequests = requests;
                },
                error: (error: HttpErrorResponse) => {
                    this.handleError(error);
                }
            });
    }

    private loadCalendarMonth(): void {
        if (!this.assignedPatient) {
            return;
        }

        this.isScheduleLoading = true;

        const range = this.getCalendarRange();

        this.calendarService
            .getEvents(
                this.assignedPatient.id,
                range.start,
                range.end
            )
            .pipe(
                finalize(() => {
                    this.isScheduleLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: events => {
                    this.calendarEvents = events;
                    this.buildCalendarDays();
                },
                error: error => {
                    console.error(
                        'Calendar events could not be loaded:',
                        error
                    );

                    this.errorMessage =
                        'The calendar could not be loaded.';
                }
            });
    }

    private loadTherapyIntakes(): void {
        if (this.therapies.length === 0) {
            this.therapyIntakes = [];
            this.buildRecentActivity();
            return;
        }

        const intakeRequests:
            Observable<TherapyIntakeResponse[]>[] =
            this.therapies.map(therapy =>
                this.therapyService
                    .getTherapyIntakes(therapy.id)
                    .pipe(catchError(() => of([])))
            );

        forkJoin(intakeRequests)
            .pipe(
                map(intakes => intakes.flat())
            )
            .subscribe({
                next: intakes => {
                    this.therapyIntakes = intakes;
                    this.buildRecentActivity();
                    this.changeDetectorRef.detectChanges();
                },
                error: error => {
                    console.error(
                        'Therapy intakes could not be loaded:',
                        error
                    );
                }
            });
    }

    private buildCalendarDays(): void {
        const firstDay = this.startOfMonth(
            this.displayedMonth
        );

        const calendarStart = new Date(firstDay);
        const mondayBasedDay =
            (firstDay.getDay() + 6) % 7;

        calendarStart.setDate(
            calendarStart.getDate() - mondayBasedDay
        );

        this.calendarDays = Array.from(
            { length: 42 },
            (_, index) => {
                const date = new Date(calendarStart);

                date.setDate(
                    calendarStart.getDate() + index
                );

                return {
                    date,
                    dayNumber: date.getDate(),
                    isCurrentMonth:
                        date.getMonth() ===
                        this.displayedMonth.getMonth(),
                    isToday: this.isSameDay(
                        date,
                        new Date()
                    ),
                    hasEvents: this.calendarEvents.some(
                        event =>
                            event.status !== 'CANCELLED' &&
                            this.isSameDay(
                                new Date(
                                    event.startDateTime
                                ),
                                date
                            )
                    )
                };
            }
        );
    }

    private buildRecentActivity(): void {
        const diaryActivity: RecentActivityItem[] =
            this.diaryEntries.map(entry => ({
                id: `diary-${entry.id}`,
                title: entry.title,
                description:
                    `Diary entry added by ${entry.authorName}`,
                date: entry.createdAt,
                type: 'DIARY'
            }));

        const therapyActivity: RecentActivityItem[] =
            this.therapies.map(therapy => ({
                id: `therapy-${therapy.id}`,
                title: therapy.name,
                description:
                    `Therapy added by ${therapy.createdByName}`,
                date: therapy.createdAt,
                type: 'THERAPY'
            }));

        const intakeActivity: RecentActivityItem[] =
            this.therapyIntakes.map(intake => ({
                id: `intake-${intake.id}`,
                title: intake.therapyName,
                description:
                    intake.status === 'TAKEN'
                        ? 'Therapy marked as taken'
                        : 'Therapy marked as skipped',
                date: intake.createdAt,
                type: 'INTAKE'
            }));

        const appointmentActivity: RecentActivityItem[] =
            this.appointmentRequests.map(request => ({
                id: `appointment-${request.id}`,
                title:
                    `Appointment with ${request.professionalName}`,
                description:
                    this.appointmentActivityDescription(
                        request
                    ),
                date: request.updatedAt,
                type: 'APPOINTMENT'
            }));

        this.recentActivity = [
            ...diaryActivity,
            ...therapyActivity,
            ...intakeActivity,
            ...appointmentActivity
        ]
            .sort(
                (first, second) =>
                    new Date(second.date).getTime() -
                    new Date(first.date).getTime()
            )
            .slice(0, 6);
    }

    private appointmentActivityDescription(
        request: AppointmentRequestResponse
    ): string {
        switch (request.status) {
            case 'APPROVED':
            case 'PARENT_ACCEPTED':
                return 'Appointment approved';

            case 'REJECTED':
            case 'PARENT_REJECTED':
                return 'Appointment declined';

            case 'RESCHEDULE_PROPOSED':
                return 'A new appointment time was proposed';

            default:
                return 'Appointment request submitted';
        }
    }

    private getCalendarRange(): {
        start: string;
        end: string;
    } {
        const start = new Date(
            this.displayedMonth.getFullYear(),
            this.displayedMonth.getMonth(),
            1
        );

        start.setDate(start.getDate() - 7);

        const end = new Date(
            this.displayedMonth.getFullYear(),
            this.displayedMonth.getMonth() + 1,
            7,
            23,
            59,
            59
        );

        return {
            start: this.toLocalDateTime(start),
            end: this.toLocalDateTime(end)
        };
    }

    private handleError(
        error: HttpErrorResponse
    ): void {
        if (error.status === 401) {
            this.errorMessage =
                'Your session has expired. Please sign in again.';
            return;
        }

        if (error.status === 403) {
            this.errorMessage =
                'You do not have permission to access this dashboard.';
            return;
        }

        this.errorMessage =
            'Coordinator information could not be loaded.';
    }

    private startOfMonth(date: Date): Date {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        );
    }

    private startOfDay(date: Date): Date {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    }

    private isSameDay(
        first: Date,
        second: Date
    ): boolean {
        return (
            first.getFullYear() === second.getFullYear() &&
            first.getMonth() === second.getMonth() &&
            first.getDate() === second.getDate()
        );
    }

    private isSameMinute(
        first: Date,
        second: Date
    ): boolean {
        return (
            this.isSameDay(first, second) &&
            first.getHours() === second.getHours() &&
            first.getMinutes() === second.getMinutes()
        );
    }

    private toDateKey(date: Date): string {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    private toLocalDateTime(date: Date): string {
        return (
            `${this.toDateKey(date)}T` +
            `${String(date.getHours()).padStart(2, '0')}:` +
            `${String(date.getMinutes()).padStart(2, '0')}:` +
            `${String(date.getSeconds()).padStart(2, '0')}`
        );
    }
}