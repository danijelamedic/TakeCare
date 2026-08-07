import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { CoordinatorConnectionResponse } from '../../core/models/coordinator.models';
import { PatientResponse} from '../../core/models/patient.models';
import { CoordinatorService } from '../../core/services/coordinator.service';
import { PatientService} from '../../core/services/patient.service';
@Component({
    selector: 'app-assigned-patient',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './assigned-patient.html',
    styleUrl: './assigned-patient.scss'
})
export class AssignedPatient implements OnInit {
    patient: PatientResponse | null = null;
    pendingRequests: CoordinatorConnectionResponse[] = [];

    isLoading = true;
    processingRequestId: number | null = null;

    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly patientService: PatientService,
        private readonly coordinatorService: CoordinatorService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadCoordinatorState();
    }

    loadCoordinatorState(): void {
        this.isLoading = true;
        this.patient = null;
        this.pendingRequests = [];
        this.errorMessage = '';

        this.patientService
            .getAssignedPatient()
            .subscribe({
                next: patient => {
                    this.patient = patient;
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.loadPendingRequests();
                        return;
                    }

                    this.isLoading = false;
                    this.handleLoadError(error);
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    loadPendingRequests(): void {
        this.coordinatorService
            .getPendingRequests()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: requests => {
                    this.pendingRequests = requests;
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                }
            });
    }

    acceptRequest(requestId: number): void {
        this.processRequest(requestId, 'accept');
    }

    declineRequest(requestId: number): void {
        this.processRequest(requestId, 'decline');
    }

    private processRequest(
        requestId: number,
        action: 'accept' | 'decline'
    ): void {
        if (this.processingRequestId !== null) {
            return;
        }

        this.processingRequestId = requestId;
        this.errorMessage = '';
        this.successMessage = '';

        const request$ =
            action === 'accept'
                ? this.coordinatorService.acceptRequest(requestId)
                : this.coordinatorService.declineRequest(requestId);

        request$
            .pipe(
                finalize(() => {
                    this.processingRequestId = null;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: response => {
                    if (action === 'accept') {
                        this.successMessage =
                            `You are now connected with ` +
                            `${response.patientFirstName} ` +
                            `${response.patientLastName}.`;

                        this.loadCoordinatorState();
                        return;
                    }

                    this.successMessage =
                        `The request from ` +
                        `${response.patientFirstName} ` +
                        `${response.patientLastName} was declined.`;

                    this.pendingRequests =
                        this.pendingRequests.filter(
                            request => request.id !== requestId
                        );
                },
                error: (error: HttpErrorResponse) => {
                    this.handleActionError(error);
                }
            });
    }

    private handleLoadError(
        error: HttpErrorResponse
    ): void {
        if (error.status === 401) {
            this.errorMessage =
                'Your session has expired. Please sign in again.';
            return;
        }

        if (error.status === 403) {
            this.errorMessage =
                'You do not have permission to access this information.';
            return;
        }

        this.errorMessage =
            'Coordinator information could not be loaded.';
    }

    private handleActionError(
        error: HttpErrorResponse
    ): void {
        if (error.status === 401) {
            this.errorMessage =
                'Your session has expired. Please sign in again.';
            return;
        }

        if (error.status === 403) {
            this.errorMessage =
                'You do not have permission to process this request.';
            return;
        }

        if (error.status === 404) {
            this.errorMessage =
                'This connection request no longer exists.';
            return;
        }

        if (error.status === 409) {
            this.errorMessage =
                error.error?.message ??
                'This request can no longer be processed.';
            return;
        }

        this.errorMessage =
            error.error?.message ??
            'The connection request could not be processed.';
    }

    getInitials(
        firstName: string,
        lastName: string
    ): string {
        return (
            firstName.charAt(0) +
            lastName.charAt(0)
        ).toUpperCase();
    }

    formatDate(value: string): string {
        return new Intl.DateTimeFormat(
            'en-GB',
            {
                dateStyle: 'medium',
                timeStyle: 'short'
            }
        ).format(new Date(value));
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
            A_NEGATIVE: 'A-',
            B_POSITIVE: 'B+',
            B_NEGATIVE: 'B-',
            AB_POSITIVE: 'AB+',
            AB_NEGATIVE: 'AB-',
            O_POSITIVE: 'O+',
            O_NEGATIVE: 'O-'
        };

        return labels[bloodType] ?? bloodType;
    }
}