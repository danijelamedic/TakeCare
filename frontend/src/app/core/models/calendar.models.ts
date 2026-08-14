export enum CalendarEventType {
    MEDICAL_APPOINTMENT = 'MEDICAL_APPOINTMENT',
    THERAPY_SESSION = 'THERAPY_SESSION',
    CONSULTATION = 'CONSULTATION',
    SCHOOL_EVENT = 'SCHOOL_EVENT',
    SUPPORT_MEETING = 'SUPPORT_MEETING',
    MEDICATION = 'MEDICATION',
    REMINDER = 'REMINDER',
    PERSONAL = 'PERSONAL',
    OTHER = 'OTHER'
}

export enum CalendarEventStatus {
    PLANNED = 'PLANNED',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface CalendarEventRequest {
    patientId: number;
    title: string;
    description: string | null;
    eventType: CalendarEventType;
    startDateTime: string;
    endDateTime: string | null;
    location: string | null;
    status: CalendarEventStatus | null;
    professionalContactId: number | null;
    reminderEnabled: boolean;
    reminderMinutesBefore: number | null;
}

export interface CalendarEventResponse {
    id: number | null;
    patientId: number;
    title: string;
    description: string | null;
    eventType: CalendarEventType;
    startDateTime: string;
    endDateTime: string | null;
    location: string | null;
    status: CalendarEventStatus;
    createdById: number | null;
    createdByName: string | null;
    professionalContactId: number | null;
    professionalName: string | null;
    professionalProfession: string | null;
    appointmentRequestId: number | null;
    therapyId: number | null;
    therapyScheduleId: number | null;
    generatedFromTherapy: boolean;
    reminderEnabled: boolean;
    reminderMinutesBefore: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}