export interface CoordinatorResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface CreateCoordinatorConnectionRequest {
    coordinatorId: number;
}

export interface CoordinatorConnectionResponse {
    id: number;

    patientId: number;
    patientFirstName: string;
    patientLastName: string;

    coordinatorId: number;
    coordinatorFirstName: string;
    coordinatorLastName: string;
    coordinatorEmail: string;

    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

    createdAt: string;
    respondedAt: string | null;
}