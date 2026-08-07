import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { CoordinatorResponse } from '../../core/models/coordinator.models';
import { CoordinatorService } from '../../core/services/coordinator.service';
import { PatientService } from '../../core/services/patient.service';
@Component({
    selector: 'app-support-coordinator',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './support-coordinator.html',
    styleUrl: './support-coordinator.scss'
})
export class SupportCoordinator implements OnInit {
    coordinators: CoordinatorResponse[] = [];

    selectedCoordinatorId: number | null = null;
    assignedCoordinator: CoordinatorResponse | null = null;
    hasCareProfile = false;

    isLoading = true;
    isSubmitting = false;

    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly coordinatorService: CoordinatorService,
        private readonly patientService: PatientService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.checkCareProfile();
    }

    checkCareProfile(): void {
        this.isLoading = true;
        this.hasCareProfile = false;
        this.coordinators = [];
        this.errorMessage = '';
        this.successMessage = '';

        this.patientService
            .getCurrentUserPatient()
            .subscribe({
                next: () => {
                    this.hasCareProfile = true;
                    this.loadAssignedCoordinator();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.hasCareProfile = false;
                        this.isLoading = false;
                        this.changeDetectorRef.detectChanges();
                        return;
                    }

                    this.isLoading = false;

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                    } else if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to access this page.';
                    } else {
                        this.errorMessage =
                            'Your care profile could not be checked.';
                    }

                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    loadCoordinators(): void {
        this.errorMessage = '';

        this.coordinatorService
            .getAvailable()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: coordinators => {
                    this.coordinators = coordinators;
                },
                error: (error: HttpErrorResponse) => {
                    console.error(
                        'Available coordinators request failed:',
                        error
                    );

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to view support coordinators.';
                        return;
                    }

                    this.errorMessage =
                        'Support coordinators could not be loaded.';
                }
            });
    }

    sendRequest(): void {
        if (!this.hasCareProfile) {
            this.errorMessage =
                'Create a care profile before sending a connection request.';
            return;
        }

        if (this.selectedCoordinatorId === null) {
            this.errorMessage =
                'Please select a support coordinator.';
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.coordinatorService
            .sendRequest({
                coordinatorId: this.selectedCoordinatorId
            })
            .pipe(
                finalize(() => {
                    this.isSubmitting = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.successMessage =
                        'Connection request sent successfully.';

                    this.selectedCoordinatorId = null;

                    this.loadCoordinators();
                },
                error: (error: HttpErrorResponse) => {
                    console.error(
                        'Coordinator connection request failed:',
                        error
                    );

                    if (error.status === 400) {
                        this.errorMessage =
                            error.error?.message ??
                            'The connection request is not valid.';
                        return;
                    }

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to send this request.';
                        return;
                    }

                    if (error.status === 409) {
                        this.errorMessage =
                            error.error?.message ??
                            'The connection request cannot be sent.';
                        return;
                    }

                    this.errorMessage =
                        error.error?.message ??
                        'The connection request could not be sent.';
                }
            });
    }

    loadAssignedCoordinator(): void {
        this.assignedCoordinator = null;
        this.errorMessage = '';

        this.coordinatorService
            .getAssignedCoordinator()
            .subscribe({
                next: coordinator => {
                    this.assignedCoordinator = coordinator;
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.loadCoordinators();
                        return;
                    }

                    this.isLoading = false;

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                    } else if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to view this coordinator.';
                    } else {
                        this.loadCoordinators();
                        return;
                    }

                    this.changeDetectorRef.detectChanges();
                }
            });
    }
}