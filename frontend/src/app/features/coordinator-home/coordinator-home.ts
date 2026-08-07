import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CoordinatorConnectionResponse } from '../../core/models/coordinator.models';
import { PatientResponse } from '../../core/models/patient.models';
import { CoordinatorService } from '../../core/services/coordinator.service';
import { PatientService } from '../../core/services/patient.service';

@Component({
    selector: 'app-coordinator-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink
    ],
    templateUrl: './coordinator-home.html',
    styleUrl: './coordinator-home.scss'
})
export class CoordinatorHome implements OnInit {
    assignedPatient: PatientResponse | null = null;
    pendingRequests: CoordinatorConnectionResponse[] = [];

    isLoading = true;
    errorMessage = '';

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
        this.errorMessage = '';
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
                    this.handleError(error);
                    this.changeDetectorRef.detectChanges();
                }
            });
    }

    private loadPendingRequests(): void {
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
                    this.handleError(error);
                }
            });
    }

    private handleError(error: HttpErrorResponse): void {
        if (error.status === 401) {
            this.errorMessage =
                'Your session has expired. Please sign in again.';
            return;
        }

        if (error.status === 403) {
            this.errorMessage =
                'You do not have permission to access this dashboard.';
            return;
        }

        this.errorMessage =
            'Coordinator information could not be loaded.';
    }
}