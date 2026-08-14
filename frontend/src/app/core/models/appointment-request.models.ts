export type AppointmentRequestStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'RESCHEDULE_PROPOSED'
    | 'PARENT_ACCEPTED'
    | 'PARENT_REJECTED';

export interface CreateAppointmentRequestRequest {
    professionalContactId: number;
    requestedDateTime: string;
    reason: string;
}

export interface RejectAppointmentRequest {
    coordinatorComment: string;
}

export interface ProposeAppointmentTimeRequest {
    proposedDateTime: string;
    coordinatorComment: string;
}

export interface RespondToProposedTimeRequest {
    accepted: boolean;
}

export interface AppointmentRequestResponse {
    id: number;

    patientId: number;
    patientName: string;

    requestedById: number;
    requestedByName: string;

    professionalContactId: number;
    professionalName: string;
    professionalProfession: string;

    requestedDateTime: string;
    proposedDateTime: string | null;

    reason: string;
    status: AppointmentRequestStatus;
    coordinatorComment: string | null;

    processedById: number | null;
    processedByName: string | null;

    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
}