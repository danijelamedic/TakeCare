export type ProfessionalType =
    | 'PEDIATRICIAN'
    | 'GENERAL_PRACTITIONER'
    | 'NEUROLOGIST'
    | 'PSYCHIATRIST'
    | 'PSYCHOLOGIST'
    | 'SPEECH_THERAPIST'
    | 'PHYSIOTHERAPIST'
    | 'OCCUPATIONAL_THERAPIST'
    | 'SPECIAL_EDUCATION_TEACHER'
    | 'SOCIAL_WORKER'
    | 'OTHER';

export interface ProfessionalContactResponse {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    professionalType: ProfessionalType;
    specialization: string | null;
    institutionName: string | null;
    phoneNumber: string | null;
    email: string | null;
    address: string | null;
    workingHours: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}