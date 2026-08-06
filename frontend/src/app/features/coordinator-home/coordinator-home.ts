import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';

import { CoordinatorConnectionResponse } from '../../core/models/coordinator.models';
import { CoordinatorService } from '../../core/services/coordinator.service';
import { PatientResponse } from '../../core/models/patient.models';
import { PatientService } from '../../core/services/patient.service';


@Component({
    selector: 'app-coordinator-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './coordinator-home.html',
    styleUrl: './coordinator-home.scss'
})
export class CoordinatorHome implements OnInit {
    pendingRequests: CoordinatorConnectionResponse[] = [];

    isLoading = true;
    processingRequestId: number | null = null;

    assignedPatient: PatientResponse | null = null;

    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly coordinatorService: CoordinatorService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly patientService: PatientService
    ) {}

    ngOnInit(): void {
        this.loadCoordinatorState();
    }

    loadPendingRequests(): void {
        this.isLoading = true;
        this.errorMessage = '';

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
                    console.error(
                        'Pending requests could not be loaded:',
                        error
                    );

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to view these requests.';
                        return;
                    }

                    this.errorMessage =
                        'Pending connection requests could not be loaded.';
                }
            });
    }

    acceptRequest(requestId: number): void {
        this.processRequest(
            requestId,
            'accept'
        );
    }

    declineRequest(requestId: number): void {
        this.processRequest(
            requestId,
            'decline'
        );
    }

    private processRequest(
        requestId: number,
        action: 'accept' | 'decline'
    ): void {
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
                    this.successMessage =
                        action === 'accept'
                            ? `You are now connected with ${response.patientFirstName} ${response.patientLastName}.`
                            : `The request from ${response.patientFirstName} ${response.patientLastName} was declined.`;

                    if (action === 'accept') {
                        this.loadCoordinatorState();
                        return;
                    }

                    this.pendingRequests =
                        this.pendingRequests.filter(
                            request => request.id !== requestId
                        );
                },
                error: (error: HttpErrorResponse) => {
                    console.error(
                        'Connection request action failed:',
                        error
                    );

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to perform this action.';
                        return;
                    }

                    this.errorMessage =
                        error.error?.message ??
                        'The connection request could not be processed.';
                }
            });
    }

    getInitials(
        firstName: string,
        lastName: string
    ): string {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`
            .toUpperCase();
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

    loadCoordinatorState(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.assignedPatient = null;
        this.pendingRequests = [];

        this.patientService
            .getAssignedPatient()
            .subscribe({
                next: patient => {
                    this.assignedPatient = patient;
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.loadPendingRequests();
                        return;
                    }

                    this.isLoading = false;

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                    } else if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to access this dashboard.';
                    } else {
                        this.errorMessage =
                            'Coordinator information could not be loaded.';
                    }

                    this.changeDetectorRef.detectChanges();
                }
            });
    }
}