import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { CalendarEventResponse, CalendarEventType } from '../../core/models/calendar.models';
import { DiaryEntryResponse } from '../../core/models/diary.models';
import { AppointmentRequestResponse } from '../../core/models/appointment-request.models';
import { TherapyIntakeResponse, TherapyResponse } from '../../core/models/therapy.models';
import { PatientResponse } from '../../core/models/patient.models';

import { AuthService } from '../../core/services/auth.service';
import { CalendarService } from '../../core/services/calendar.service';
import { DiaryService } from '../../core/services/diary.service';
import { AppointmentRequestService } from '../../core/services/appointment-request.service';
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
    type: 'DIARY' | 'THERAPY' | 'INTAKE' | 'APPOINTMENT';
}

@Component({
    selector: 'app-parent-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './parent-home.html',
    styleUrl: './parent-home.scss'
})
export class ParentHome implements OnInit {

    patient: PatientResponse | null = null;

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

    intakeInProgressKey: string | null = null;

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly calendarService: CalendarService,
        private readonly therapyService: TherapyService,
        private readonly diaryService: DiaryService,
        private readonly appointmentRequestService:
            AppointmentRequestService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadDashboard();
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

    getEventKey(event: CalendarEventResponse): string {
        return [
            event.therapyId ?? 'event',
            event.therapyScheduleId ?? 'schedule',
            event.startDateTime
        ].join('-');
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
            .sort((first, second) =>
                new Date(first.startDateTime).getTime() -
                new Date(second.startDateTime).getTime()
            );
    }

    get hasCareProfile(): boolean {
        return this.patient !== null;
    }

    get activeTherapiesCount(): number {
        return this.therapies.filter(
            therapy => therapy.status === 'ACTIVE'
        ).length;
    }

    get upcomingAppointmentsCount(): number {
        const now = new Date().getTime();

        return this.appointmentRequests.filter(request => {
            const isApproved =
                request.status === 'APPROVED' ||
                request.status === 'PARENT_ACCEPTED';

            if (!isApproved) {
                return false;
            }

            const appointmentDate =
                request.status === 'PARENT_ACCEPTED' &&
                request.proposedDateTime
                    ? request.proposedDateTime
                    : request.requestedDateTime;

            return new Date(appointmentDate).getTime() >= now;
        }).length;
    }

    get pendingAppointmentRequestsCount(): number {
        return this.appointmentRequests.filter(
            request =>
                request.status === 'PENDING' ||
                request.status === 'RESCHEDULE_PROPOSED'
        ).length;
    }

    loadDashboard(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.patientService
            .getCurrentUserPatient()
            .pipe(
                switchMap(patient => {
                    this.patient = patient;

                    return this.loadDashboardData(patient.id);
                }),
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

                    this.loadTherapyIntakes();
                    this.buildCalendarDays();
                    this.buildRecentActivity();
                },
                error: (error: HttpErrorResponse) => {
                    this.handleDashboardError(error);
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
            this.displayedMonth = this.startOfMonth(day.date);
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

    eventTypeLabel(event: CalendarEventResponse): string {
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

    isTherapyEvent(event: CalendarEventResponse): boolean {
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

    isTherapyTaken(event: CalendarEventResponse): boolean {
        return this.getIntakeForEvent(event)?.status === 'TAKEN';
    }

    isTherapySkipped(event: CalendarEventResponse): boolean {
        return this.getIntakeForEvent(event)?.status === 'SKIPPED';
    }

    canMarkTherapyAsTaken(
        event: CalendarEventResponse
    ): boolean {
        return (
            this.isSelectedDateToday &&
            this.isTherapyEvent(event) &&
            !this.getIntakeForEvent(event) &&
            this.intakeInProgressKey !== this.getEventKey(event)
        );
    }

    markTherapyAsTaken(
        event: CalendarEventResponse
    ): void {
        if (
            !event.therapyId ||
            !this.canMarkTherapyAsTaken(event)
        ) {
            return;
        }

        this.intakeInProgressKey = this.getEventKey(event);

        this.therapyService
            .createIntake(
                event.therapyId,
                {
                    scheduledAt:
                        this.normalizeLocalDateTime(
                            event.startDateTime
                        ),
                    status: 'TAKEN',
                    takenAt: this.toLocalDateTime(new Date()),
                    notes: null
                }
            )
            .pipe(
                finalize(() => {
                    this.intakeInProgressKey = null;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: intake => {
                    this.therapyIntakes = [
                        intake,
                        ...this.therapyIntakes
                    ];

                    this.buildRecentActivity();
                },
                error: error => {
                    console.error(
                        'Therapy intake could not be recorded:',
                        error
                    );

                    this.errorMessage =
                        'The therapy could not be marked as taken.';
                }
            });
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
        return `${event.id}-${event.startDateTime}`;
    }

    trackActivity(
        _index: number,
        activity: RecentActivityItem
    ): string {
        return activity.id;
    }

    private loadDashboardData(
        patientId: number
    ): Observable<{
        events: CalendarEventResponse[];
        therapies: TherapyResponse[];
        diaryEntries: DiaryEntryResponse[];
        appointmentRequests: AppointmentRequestResponse[];
    }> {
        const range = this.getCalendarRange();

        return forkJoin({
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
                    .getParentRequests()
                    .pipe(catchError(() => of([])))
        });
    }

    private loadCalendarMonth(): void {
        if (!this.patient) {
            return;
        }

        this.isScheduleLoading = true;

        const range = this.getCalendarRange();

        this.calendarService
            .getEvents(
                this.patient.id,
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

        const intakeRequests =
            this.therapies.map(therapy =>
                this.therapyService
                    .getTherapyIntakes(therapy.id)
                    .pipe(catchError(() => of([])))
            );

        forkJoin(intakeRequests)
            .pipe(
                map(intakes =>
                    intakes.flat()
                )
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

        this.calendarDays = Array
            .from({ length: 42 }, (_, index) => {
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
            });
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

    private handleDashboardError(
        error: HttpErrorResponse
    ): void {
        if (error.status === 404) {
            this.patient = null;
            return;
        }

        if (error.status === 401) {
            this.errorMessage =
                'Your session has expired. Please sign in again.';
            return;
        }

        this.errorMessage =
            'The dashboard could not be loaded.';
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

    private normalizeLocalDateTime(value: string): string {
        return value.replace('Z', '').slice(0, 19);
    }
}