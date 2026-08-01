import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    OnInit
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import {
    PatientResponse
} from '../../core/models/patient.models';
import {
    PatientService
} from '../../core/services/patient.service';

@Component({
    selector: 'app-care-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './care-profile.html',
    styleUrl: './care-profile.scss'
})
export class CareProfile implements OnInit {
    patient: PatientResponse | null = null;

    isLoading = true;
    profileNotCreated = false;
    errorMessage = '';

    isEditing = false;

    constructor(
        private readonly patientService: PatientService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadPatient();
    }

    loadPatient(): void {
        this.isLoading = true;
        this.patient = null;
        this.profileNotCreated = false;
        this.errorMessage = '';

        this.patientService
            .getCurrentUserPatient()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: patient => {
                    console.log('Patient received:', patient);

                    this.patient = patient;
                },
                error: (error: HttpErrorResponse) => {
                    console.error(
                        'Patient request failed:',
                        error
                    );

                    if (error.status === 404) {
                        this.profileNotCreated = true;
                        return;
                    }

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to view this profile.';
                        return;
                    }

                    this.errorMessage =
                        'Care profile could not be loaded.';
                }
            });
    }


    startEditing(): void {
        this.isEditing = true;
    }

    formatGender(gender: string | null): string {
        if (!gender) {
            return 'Not provided';
        }

        const labels: Record<string, string> = {
            MALE: 'Male',
            FEMALE: 'Female',
            OTHER: 'Other',
            NOT_SPECIFIED: 'Not specified'
        };

        return labels[gender] ?? gender;
    }

    formatBloodType(bloodType: string | null): string {
        if (!bloodType || bloodType === 'UNKNOWN') {
            return 'Unknown';
        }

        const labels: Record<string, string> = {
            A_POSITIVE: 'A+',
            A_NEGATIVE: 'A−',
            B_POSITIVE: 'B+',
            B_NEGATIVE: 'B−',
            AB_POSITIVE: 'AB+',
            AB_NEGATIVE: 'AB−',
            O_POSITIVE: 'O+',
            O_NEGATIVE: 'O−'
        };

        return labels[bloodType] ?? bloodType;
    }
}