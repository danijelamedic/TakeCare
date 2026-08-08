export enum DiaryEntryType {
    GENERAL = 'GENERAL',
    HEALTH = 'HEALTH',
    BEHAVIOR = 'BEHAVIOR',
    MOOD = 'MOOD',
    SCHOOL = 'SCHOOL',
    THERAPY = 'THERAPY',
    PROFESSIONAL_NOTE = 'PROFESSIONAL_NOTE',
    COORDINATION_NOTE = 'COORDINATION_NOTE',
    IMPORTANT_EVENT = 'IMPORTANT_EVENT',
    OTHER = 'OTHER'
}

export enum DiaryEntryVisibility {
    PRIVATE_TO_PARENT = 'PRIVATE_TO_PARENT',
    SHARED = 'SHARED'
}

export interface DiaryEntryRequest {
    patientId: number;
    title: string;
    content: string;
    entryType: DiaryEntryType;
    entryDate: string | null;
    visibility: DiaryEntryVisibility | null;
}

export interface DiaryEntryResponse {
    id: number;
    patientId: number;
    title: string;
    content: string;
    entryType: DiaryEntryType;
    entryDate: string | null;
    authorId: number;
    authorName: string;
    authorRole: string;
    visibility: DiaryEntryVisibility;
    createdAt: string;
    updatedAt: string;
}