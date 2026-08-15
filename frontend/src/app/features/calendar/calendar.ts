import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Calendar as FullCalendarApi, CalendarOptions, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendarEventResponse, CalendarEventRequest, CalendarEventType, CalendarEventStatus } from '../../core/models/calendar.models';
import { AuthService } from '../../core/services/auth.service';
import { CalendarService } from '../../core/services/calendar.service';
import { PatientService } from '../../core/services/patient.service';

type CalendarEventFilter =
    | 'APPOINTMENTS'
    | 'THERAPIES'
    | 'CONSULTATIONS'
    | 'SCHOOL'
    | 'OTHER';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule 
    ],
    templateUrl: './calendar.html',
    styleUrl: './calendar.scss'
})
export class Calendar implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('calendarHost')
    private calendarHost!: ElementRef<HTMLDivElement>;

    private fullCalendar: FullCalendarApi | null = null;

    patientId: number | null = null;
    currentUserId: number | null = null;

    events: CalendarEventResponse[] = [];
    selectedEvent: CalendarEventResponse | null = null;
    activeEventFilter: CalendarEventFilter | null = null;

    editingEventId: number | null = null;

    isDeleteConfirmationOpen = false;
    isDeleting = false;

    isCoordinator = false;
    isLoading = true;

    errorMessage = '';

    private visibleStart: string | null = null;
    private visibleEnd: string | null = null;
    private requestedAppointmentId: number | null = null;
    private requestedDate: string | null = null;

    eventForm: FormGroup;

    isFormOpen = false;
    isSaving = false;

    successMessage = '';

    readonly manualEventTypes: CalendarEventType[] = [
        CalendarEventType.CONSULTATION,
        CalendarEventType.SCHOOL_EVENT,
        CalendarEventType.SUPPORT_MEETING,
        CalendarEventType.MEDICATION,
        CalendarEventType.REMINDER,
        CalendarEventType.PERSONAL,
        CalendarEventType.OTHER
    ];

    readonly eventStatuses = [
        CalendarEventStatus.PLANNED,
        CalendarEventStatus.CONFIRMED
    ];

    calendarOptions: CalendarOptions = {
        plugins: [
            dayGridPlugin,
            interactionPlugin
        ],
        initialView: 'dayGridMonth',

        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },

        firstDay: 1,
        fixedWeekCount: false,
        showNonCurrentDates: true,
        dayMaxEvents: 3,

        height: 'auto',

        events: [],

        datesSet: argument => {
            this.handleDatesSet(argument);
        },

        eventClick: argument => {
            this.handleEventClick(argument);
        }
    };

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly activatedRoute: ActivatedRoute,
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly calendarService: CalendarService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {
        this.eventForm = this.formBuilder.group({
            title: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(200)
                ]
            ],
            description: [
                '',
                Validators.maxLength(5000)
            ],
            eventType: [
                CalendarEventType.PERSONAL,
                Validators.required
            ],
            startDateTime: [
                '',
                Validators.required
            ],
            endDateTime: [''],
            location: [
                '',
                Validators.maxLength(255)
            ],
            status: [
                CalendarEventStatus.PLANNED,
                Validators.required
            ],
            reminderEnabled: [false],
            reminderMinutesBefore: [10]
        });
    }

    ngOnInit(): void {
        this.applyCalendarNavigation();
        this.initializeCalendar();
    }

    ngAfterViewInit(): void {
        this.fullCalendar = new FullCalendarApi(
            this.calendarHost.nativeElement,
            this.calendarOptions
        );

        this.fullCalendar.render();
    }

    ngOnDestroy(): void {
        this.fullCalendar?.destroy();
    }

    get canModifySelectedEvent(): boolean {
        if (
            !this.selectedEvent ||
            this.selectedEvent.generatedFromTherapy ||
            this.selectedEvent.appointmentRequestId !== null
        ) {
            return false;
        }

        return (
            this.selectedEvent.createdById ===
            this.currentUserId
        );
    }

    closeEventDetails(): void {
        this.selectedEvent = null;
        this.isDeleteConfirmationOpen = false;
    }

    private initializeCalendar(): void {
        const currentUser =
            this.authService.getCurrentUser();

        if (!currentUser) {
            this.isLoading = false;
            this.errorMessage =
                'User information could not be loaded.';
            return;
        }

        this.currentUserId = currentUser.id;

        const role =
            currentUser.role?.toUpperCase() ?? '';

        this.isCoordinator =
            role.includes('COORDINATOR');

        if (this.isCoordinator) {
            this.loadAssignedPatient();
        } else {
            this.loadCurrentUserPatient();
        }
    }

    openCreateForm(): void {
        if (this.patientId === null) {
            return;
        }

        this.editingEventId = null;
        this.isDeleteConfirmationOpen = false;
        this.selectedEvent = null;
        this.errorMessage = '';
        this.successMessage = '';
        this.isFormOpen = true;

        const startDate = new Date();
        startDate.setHours(
            startDate.getHours() + 1,
            0,
            0,
            0
        );

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        this.eventForm.reset({
            title: '',
            description: '',
            eventType: CalendarEventType.PERSONAL,
            startDateTime:
                this.toDateTimeLocalValue(startDate),
            endDateTime:
                this.toDateTimeLocalValue(endDate),
            location: '',
            status: CalendarEventStatus.PLANNED,
            reminderEnabled: false,
            reminderMinutesBefore: 10
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    closeCreateForm(): void {
        this.isFormOpen = false;
        this.isSaving = false;
        this.editingEventId = null;
        this.eventForm.reset();
    }

    saveEvent(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (
            this.eventForm.invalid ||
            this.patientId === null
        ) {
            this.eventForm.markAllAsTouched();
            return;
        }

        const value = this.eventForm.getRawValue();

        if (
            value.endDateTime &&
            value.endDateTime <= value.startDateTime
        ) {
            this.errorMessage =
                'Event end must be after its start.';
            return;
        }

        const request: CalendarEventRequest = {
            patientId: this.patientId,
            title: value.title.trim(),

            description:
                value.description?.trim() || null,

            eventType: value.eventType,

            startDateTime:
                this.normalizeDateTime(
                    value.startDateTime
                ),

            endDateTime:
                value.endDateTime
                    ? this.normalizeDateTime(
                        value.endDateTime
                    )
                    : null,

            location:
                value.location?.trim() || null,

            status: value.status,
            professionalContactId: null,

            reminderEnabled:
                value.reminderEnabled,

            reminderMinutesBefore:
                value.reminderEnabled
                    ? 10
                    : null
        };

        this.isSaving = true;

        const editedEventId = this.editingEventId;
        const isEditing = editedEventId !== null;

        const saveRequest = isEditing
            ? this.calendarService.updateEvent(
                editedEventId,
                request
            )
            : this.calendarService.createEvent(request);

        saveRequest.subscribe({
            next: () => {
                this.isSaving = false;
                this.closeCreateForm();

                this.successMessage = isEditing
                    ? 'Calendar event was updated successfully.'
                    : 'Calendar event was added successfully.';

                this.loadVisibleEvents();
            },
            error: error => {
                this.isSaving = false;

                this.errorMessage =
                    error.error?.message ??
                    (
                        isEditing
                            ? 'Calendar event could not be updated.'
                            : 'Calendar event could not be added.'
                    );

                this.refreshView();
            }
        });
    }

    private loadCurrentUserPatient(): void {
        this.patientService
            .getCurrentUserPatient()
            .subscribe({
                next: patient => {
                    this.patientId = patient.id;
                    this.loadVisibleEvents();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'Create a care profile before using the calendar.';
                    this.refreshView();
                }
            });
    }

    private loadAssignedPatient(): void {
        this.patientService
            .getAssignedPatient()
            .subscribe({
                next: patient => {
                    this.patientId = patient.id;
                    this.loadVisibleEvents();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'No patient is currently assigned to you.';
                    this.refreshView();
                }
            });
    }

    private handleDatesSet(
        argument: DatesSetArg
    ): void {
        this.visibleStart =
            this.toLocalDateTime(argument.start);

        this.visibleEnd =
            this.toLocalDateTime(argument.end);

        this.loadVisibleEvents();
    }

    private loadVisibleEvents(): void {
        if (
            this.patientId === null ||
            this.visibleStart === null ||
            this.visibleEnd === null
        ) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.calendarService
            .getEvents(
                this.patientId,
                this.visibleStart,
                this.visibleEnd
            )
            .subscribe({
                next: events => {
                    this.events = events;
                    this.refreshCalendarEvents();
                    this.openRequestedAppointment(events);

                    this.isLoading = false;
                    this.refreshView();
                },
                error: error => {
                    this.isLoading = false;
                    this.errorMessage =
                        error.error?.message ??
                        'Calendar events could not be loaded.';
                    this.refreshView();
                }
            });
    }

    private openRequestedAppointment(events: CalendarEventResponse[]): void {
        if (this.requestedAppointmentId === null) {
            return;
        }

        const appointmentEvent = events.find(
            event =>
            event.appointmentRequestId ===
            this.requestedAppointmentId
        );

        if (!appointmentEvent) {
            return;
        }

        this.selectedEvent = appointmentEvent;
        this.requestedAppointmentId = null;
    }

    setEventFilter(filter: CalendarEventFilter): void {
        this.activeEventFilter =
            this.activeEventFilter === filter
                ? null
                : filter;

        if (
            this.selectedEvent &&
            !this.matchesActiveFilter(this.selectedEvent)
        ) {
            this.selectedEvent = null;
        }

        this.refreshCalendarEvents();
        this.refreshView();
    }

    isFilterActive(filter: CalendarEventFilter): boolean {
        return this.activeEventFilter === filter;
    }

    private refreshCalendarEvents(): void {
        const visibleEvents = this.events.filter(
            event => this.matchesActiveFilter(event)
        );

        const calendarEvents = visibleEvents.map(
            event => this.mapToFullCalendarEvent(event)
        );

        this.fullCalendar?.removeAllEvents();
        this.fullCalendar?.addEventSource(calendarEvents);
    }

    private matchesActiveFilter(
        event: CalendarEventResponse
    ): boolean {
        if (this.activeEventFilter === null) {
            return true;
        }

        switch (this.activeEventFilter) {
            case 'APPOINTMENTS':
                return (
                    event.eventType ===
                    CalendarEventType.MEDICAL_APPOINTMENT
                );

            case 'THERAPIES':
                return (
                    event.eventType ===
                        CalendarEventType.THERAPY_SESSION ||
                    event.eventType ===
                        CalendarEventType.MEDICATION
                );

            case 'CONSULTATIONS':
                return (
                    event.eventType ===
                        CalendarEventType.CONSULTATION ||
                    event.eventType ===
                        CalendarEventType.SUPPORT_MEETING
                );

            case 'SCHOOL':
                return (
                    event.eventType ===
                    CalendarEventType.SCHOOL_EVENT
                );

            case 'OTHER':
                return ![
                    CalendarEventType.MEDICAL_APPOINTMENT,
                    CalendarEventType.THERAPY_SESSION,
                    CalendarEventType.MEDICATION,
                    CalendarEventType.CONSULTATION,
                    CalendarEventType.SUPPORT_MEETING,
                    CalendarEventType.SCHOOL_EVENT
                ].includes(event.eventType);

            default:
                return true;
        }
    }

    private mapToFullCalendarEvent(
        event: CalendarEventResponse
    ): EventInput {
        const colors =
            this.getEventColors(event.eventType);

        return {
            id: this.getCalendarEventId(event),
            title: event.title,
            start: event.startDateTime,
            end: event.endDateTime ?? undefined,

            backgroundColor: colors.background,
            borderColor: colors.border,
            textColor: colors.text,

            extendedProps: {
                calendarEvent: event
            }
        };
    }

    private getCalendarEventId(
        event: CalendarEventResponse
    ): string {
        if (event.id !== null) {
            return `event-${event.id}`;
        }

        return [
            'therapy',
            event.therapyId,
            event.therapyScheduleId,
            event.startDateTime
        ].join('-');
    }

    private getEventColors(
        eventType: CalendarEventType
    ): {
        background: string;
        border: string;
        text: string;
    } {
        switch (eventType) {
            case CalendarEventType.MEDICAL_APPOINTMENT:
                return {
                    background: '#3C6997',
                    border: '#3C6997',
                    text: '#FFFFFF'
                };

            case CalendarEventType.THERAPY_SESSION:
            case CalendarEventType.MEDICATION:
                return {
                    background: '#BFACC8',
                    border: '#BFACC8',
                    text: '#094074'
                };

            case CalendarEventType.CONSULTATION:
            case CalendarEventType.SUPPORT_MEETING:
                return {
                    background: '#5ADBFF',
                    border: '#5ADBFF',
                    text: '#094074'
                };

            case CalendarEventType.SCHOOL_EVENT:
                return {
                    background: '#094074',
                    border: '#094074',
                    text: '#FFFFFF'
                };

            default:
                return {
                    background: '#E7EEF6',
                    border: '#3C6997',
                    text: '#094074'
                };
        }
    }

    private handleEventClick(
        argument: EventClickArg
    ): void {
        this.isDeleteConfirmationOpen = false;

        this.selectedEvent =
            argument.event.extendedProps[
                'calendarEvent'
            ] as CalendarEventResponse;

        this.refreshView();
    }

    private toLocalDateTime(date: Date): string {
        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, '0');

        const day = String(
            date.getDate()
        ).padStart(2, '0');

        const hours = String(
            date.getHours()
        ).padStart(2, '0');

        const minutes = String(
            date.getMinutes()
        ).padStart(2, '0');

        const seconds = String(
            date.getSeconds()
        ).padStart(2, '0');

        return (
            `${year}-${month}-${day}` +
            `T${hours}:${minutes}:${seconds}`
        );
    }

    getEnumLabel(value: string): string {
        return value
            .toLowerCase()
            .split('_')
            .map(
                word =>
                    word.charAt(0).toUpperCase() +
                    word.substring(1)
            )
            .join(' ');
    }

    getEventSourceLabel(
        event: CalendarEventResponse
    ): string {
        if (event.generatedFromTherapy) {
            return 'Therapy schedule';
        }

        if (event.appointmentRequestId !== null) {
            return 'Approved appointment';
        }

        return 'Calendar event';
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }

    private normalizeDateTime(
        value: string
    ): string {
        return value.length === 16
            ? `${value}:00`
            : value;
    }

    private toDateTimeLocalValue(
        date: Date
    ): string {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, '0');

        const day = String(
            date.getDate()
        ).padStart(2, '0');

        const hours = String(
            date.getHours()
        ).padStart(2, '0');

        const minutes = String(
            date.getMinutes()
        ).padStart(2, '0');

        return (
            `${year}-${month}-${day}` +
            `T${hours}:${minutes}`
        );
    }

    openEditForm(): void {
        const event = this.selectedEvent;

        if (
            !event ||
            event.id === null ||
            !this.canModifySelectedEvent
        ) {
            return;
        }

        this.editingEventId = event.id;
        this.isFormOpen = true;
        this.isDeleteConfirmationOpen = false;
        this.errorMessage = '';
        this.successMessage = '';

        this.eventForm.reset({
            title: event.title,
            description: event.description ?? '',
            eventType: event.eventType,
            startDateTime:
                this.toDateTimeInputValue(
                    event.startDateTime
                ),
            endDateTime:
                this.toDateTimeInputValue(
                    event.endDateTime
                ),
            location: event.location ?? '',
            status: event.status,
            reminderEnabled: event.reminderEnabled,
            reminderMinutesBefore: 10
        });

        this.selectedEvent = null;

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        this.refreshView();
    }

    private toDateTimeInputValue(
        value: string | null
    ): string {
        if (!value) {
            return '';
        }

        return value.substring(0, 16);
    }

    showDeleteConfirmation(): void {
        if (!this.canModifySelectedEvent) {
            return;
        }

        this.isDeleteConfirmationOpen = true;
    }

    cancelDelete(): void {
        this.isDeleteConfirmationOpen = false;
    }

    deleteSelectedEvent(): void {
        if (
            !this.canModifySelectedEvent ||
            this.selectedEvent?.id === null ||
            this.selectedEvent?.id === undefined
        ) {
            return;
        }

        const eventId = this.selectedEvent.id;

        this.isDeleting = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.calendarService
            .deleteEvent(eventId)
            .subscribe({
                next: () => {
                    this.isDeleting = false;
                    this.isDeleteConfirmationOpen = false;
                    this.selectedEvent = null;

                    this.successMessage =
                        'Calendar event was deleted successfully.';

                    this.loadVisibleEvents();
                },
                error: error => {
                    this.isDeleting = false;

                    this.errorMessage =
                        error.error?.message ??
                        'Calendar event could not be deleted.';

                    this.refreshView();
                }
            });
    }

    private applyCalendarNavigation(): void {
        const date =
            this.activatedRoute.snapshot.queryParamMap.get('date');

        const appointmentIdValue =
            this.activatedRoute.snapshot.queryParamMap.get(
            'appointmentRequestId'
            );

        if (
            date !== null &&
            /^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {
            this.requestedDate = date;
            this.calendarOptions.initialDate = date;
        }

        if (appointmentIdValue !== null) {
            const appointmentId = Number(appointmentIdValue);

            if (
            Number.isInteger(appointmentId) &&
            appointmentId > 0
            ) {
            this.requestedAppointmentId = appointmentId;
            }
        }
    }
}