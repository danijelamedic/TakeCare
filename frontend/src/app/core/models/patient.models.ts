export interface PatientRequest {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string | null;
    profileImage: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    bloodType: string | null;
    allergies: string | null;
    specialNeeds: string | null;
    importantInformation: string | null;
    generalNotes: string | null;
}

export interface PatientResponse {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string | null;
    profileImage: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    bloodType: string | null;
    allergies: string | null;
    specialNeeds: string | null;
    importantInformation: string | null;
    generalNotes: string | null;
    parentId: number;
    supportCoordinatorId: number | null;
    createdAt: string;
    updatedAt: string;
}