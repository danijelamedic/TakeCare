export type TherapyStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface TherapyScheduleRequest {
  time: string;
  daysOfWeek: DayOfWeek[];
  frequencyDescription?: string | null;
  startDate: string;
  endDate?: string | null;
  instructions?: string | null;
}

export interface TherapyScheduleResponse {
  id: number;
  time: string;
  daysOfWeek: DayOfWeek[];
  frequencyDescription: string | null;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
}

export interface TherapyRequest {
  patientId: number;
  name: string;
  description?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
  status?: TherapyStatus | null;
  prescribedById?: number | null;
  notes?: string | null;
  schedules: TherapyScheduleRequest[];
}

export interface TherapyResponse {
  id: number;
  patientId: number;
  name: string;
  description: string | null;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  status: TherapyStatus;

  prescribedById: number | null;
  prescribedByName: string | null;

  createdById: number;
  createdByName: string;
  createdByRole: string;

  notes: string | null;
  schedules: TherapyScheduleResponse[];

  createdAt: string;
  updatedAt: string;
}

export type TherapyIntakeStatus = 'TAKEN' | 'SKIPPED';

export interface TherapyIntakeRequest {
  scheduledAt: string;
  status: TherapyIntakeStatus;
  takenAt?: string | null;
  notes?: string | null;
}

export interface TherapyIntakeResponse {
  id: number;
  therapyId: number;
  therapyName: string;
  patientId: number;

  scheduledAt: string;
  status: TherapyIntakeStatus;
  takenAt: string | null;
  notes: string | null;

  recordedById: number;
  recordedByName: string;
  recordedByRole: string;

  createdAt: string;
  updatedAt: string;
}