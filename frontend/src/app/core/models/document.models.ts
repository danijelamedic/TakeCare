import { ProfessionalType } from './professional-contact.models';

export type DocumentType =
    | 'MEDICAL_REPORT'
    | 'PRESCRIPTION'
    | 'LAB_RESULT'
    | 'THERAPY_PLAN'
    | 'ASSESSMENT'
    | 'VACCINATION_RECORD'
    | 'SCHOOL_DOCUMENT'
    | 'SOCIAL_SERVICE_DOCUMENT'
    | 'REFERRAL'
    | 'INSURANCE_DOCUMENT'
    | 'OTHER';

export type DocumentVisibility =
    | 'PRIVATE_TO_PARENT'
    | 'SHARED';

export type DocumentUploaderRole =
    | 'PARENT'
    | 'SUPPORT_COORDINATOR';

export interface DocumentResponse {
    id: number;
    patientId: number;
    title: string;
    documentType: DocumentType;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    description: string | null;
    documentDate: string | null;
    issuedById: number | null;
    issuedByName: string | null;
    issuedByProfessionalType: ProfessionalType | null;
    visibility: DocumentVisibility;
    uploadedById: number;
    uploadedByName: string;
    uploadedByRole: DocumentUploaderRole;
    uploadedAt: string;
    updatedAt: string;
}

export interface DocumentUploadData {
    patientId: number;
    title: string;
    documentType: DocumentType;
    description?: string;
    documentDate?: string;
    issuedById?: number;
    visibility?: DocumentVisibility;
    file: File;
}

export interface UpdateDocumentRequest {
    title: string;
    documentType: DocumentType;
    description: string | null;
    documentDate: string | null;
    issuedById: number | null;
    visibility: DocumentVisibility | null;
}