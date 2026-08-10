import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    OnInit
} from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { TherapyService } from '../../../core/services/therapy.service';

import {
    TherapyResponse,
    TherapyStatus
} from '../../../core/models/therapy.models';

type TherapyFilter = 'ALL' | TherapyStatus;

@Component({
    selector: 'app-therapy-list',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './therapy-list.html',
    styleUrl: './therapy-list.scss'
})
export class TherapyList implements OnInit {

    therapies: TherapyResponse[] = [];

    patientId: number | null = null;

    selectedFilter: TherapyFilter = 'ALL';

    readonly filters: {
        label: string;
        value: TherapyFilter;
    }[] = [
        {
            label: 'All',
            value: 'ALL'
        },
        {
            label: 'Active',
            value: 'ACTIVE'
        },
        {
            label: 'Paused',
            value: 'PAUSED'
        },
        {
            label: 'Completed',
            value: 'COMPLETED'
        }
    ];

    isCoordinator = false;
    isLoading = true;

    updatingTherapyId: number | null = null;

    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly therapyService: TherapyService,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.initializeTherapies();
    }

    private initializeTherapies(): void {
        const currentUser = this.authService.getCurrentUser();

        if (!currentUser) {
            this.isLoading = false;
            this.errorMessage =
                'User information could not be loaded.';
            this.refreshView();
            return;
        }

        const role = currentUser.role?.toUpperCase() ?? '';

        this.isCoordinator = role.includes('COORDINATOR');

        if (this.isCoordinator) {
            this.loadAssignedPatient();
        } else {
            this.loadCurrentUserPatient();
        }
    }

    private loadCurrentUserPatient(): void {
        this.patientService.getCurrentUserPatient().subscribe({
            next: patient => {
                this.patientId = patient.id;
                this.loadTherapies();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'Create a care profile before viewing therapies.';
                this.refreshView();
            }
        });
    }

    private loadAssignedPatient(): void {
        this.patientService.getAssignedPatient().subscribe({
            next: patient => {
                this.patientId = patient.id;
                this.loadTherapies();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'No patient is currently assigned to you.';
                this.refreshView();
            }
        });
    }

    loadTherapies(): void {
        if (this.patientId === null) {
            this.isLoading = false;
            this.refreshView();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const status =
            this.selectedFilter === 'ALL'
                ? undefined
                : this.selectedFilter;

        this.therapyService
            .getPatientTherapies(this.patientId, status)
            .subscribe({
                next: therapies => {
                    this.therapies = [...therapies].sort(
                        (first, second) =>
                            this.getStatusOrder(first.status) -
                            this.getStatusOrder(second.status) ||
                            this.getDateTimestamp(first.startDate) -
                            this.getDateTimestamp(second.startDate)
                    );

                    this.isLoading = false;
                    this.refreshView();
                },
                error: () => {
                    this.therapies = [];
                    this.isLoading = false;
                    this.errorMessage =
                        'Therapies could not be loaded.';
                    this.refreshView();
                }
            });
    }

    selectFilter(filter: TherapyFilter): void {
        if (
            this.selectedFilter === filter ||
            this.isLoading
        ) {
            return;
        }

        this.selectedFilter = filter;
        this.clearMessages();
        this.loadTherapies();
    }

    openCreateTherapy(): void {
        const routePrefix = this.getRoutePrefix();

        this.router.navigate([
            routePrefix,
            'therapies',
            'create'
        ]);
    }

    openTherapyDetails(therapyId: number): void {
        const routePrefix = this.getRoutePrefix();

        this.router.navigate([
            routePrefix,
            'therapies',
            therapyId
        ]);
    }

    openEditTherapy(therapyId: number): void {
        const routePrefix = this.getRoutePrefix();

        this.router.navigate([
            routePrefix,
            'therapies',
            therapyId,
            'edit'
        ]);
    }

    openIntakeForm(therapyId: number): void {
        if (this.isCoordinator) {
            return;
        }

        this.router.navigate([
            '/parent',
            'therapies',
            therapyId,
            'intakes',
            'create'
        ]);
    }

    updateStatus(
        therapy: TherapyResponse,
        status: TherapyStatus
    ): void {
        if (
            therapy.status === status ||
            this.updatingTherapyId !== null
        ) {
            return;
        }

        this.clearMessages();
        this.updatingTherapyId = therapy.id;

        this.therapyService
            .updateTherapyStatus(therapy.id, status)
            .subscribe({
                next: updatedTherapy => {
                    this.updatingTherapyId = null;
                    this.successMessage =
                        'Therapy status has been updated.';

                    if (
                        this.selectedFilter !== 'ALL' &&
                        updatedTherapy.status !== this.selectedFilter
                    ) {
                        this.therapies = this.therapies.filter(
                            currentTherapy =>
                                currentTherapy.id !==
                                updatedTherapy.id
                        );
                    } else {
                        this.therapies = this.therapies.map(
                            currentTherapy =>
                                currentTherapy.id ===
                                updatedTherapy.id
                                    ? updatedTherapy
                                    : currentTherapy
                        );
                    }

                    this.refreshView();
                },
                error: () => {
                    this.updatingTherapyId = null;
                    this.errorMessage =
                        'Therapy status could not be updated.';
                    this.refreshView();
                }
            });
    }

    getStatusLabel(status: TherapyStatus): string {
        switch (status) {
            case 'ACTIVE':
                return 'Active';
            case 'PAUSED':
                return 'Paused';
            case 'COMPLETED':
                return 'Completed';
        }
    }

    getScheduleDays(therapy: TherapyResponse): string {
        const uniqueDays = new Set(
            therapy.schedules.flatMap(
                schedule => schedule.daysOfWeek
            )
        );

        if (uniqueDays.size === 0) {
            return 'No days specified';
        }

        const dayLabels: Record<string, string> = {
            MONDAY: 'Mon',
            TUESDAY: 'Tue',
            WEDNESDAY: 'Wed',
            THURSDAY: 'Thu',
            FRIDAY: 'Fri',
            SATURDAY: 'Sat',
            SUNDAY: 'Sun'
        };

        return Array.from(uniqueDays)
            .map(day => dayLabels[day] ?? day)
            .join(', ');
    }

    getScheduleTimes(therapy: TherapyResponse): string {
        const uniqueTimes = new Set(
            therapy.schedules.map(
                schedule => schedule.time.substring(0, 5)
            )
        );

        if (uniqueTimes.size === 0) {
            return 'No time specified';
        }

        return Array.from(uniqueTimes).join(', ');
    }

    trackTherapyById(
        index: number,
        therapy: TherapyResponse
    ): number {
        return therapy.id;
    }

    private getRoutePrefix(): string {
        return this.isCoordinator
            ? '/coordinator'
            : '/parent';
    }

    private getStatusOrder(status: TherapyStatus): number {
        const order: Record<TherapyStatus, number> = {
            ACTIVE: 1,
            PAUSED: 2,
            COMPLETED: 3
        };

        return order[status];
    }

    private getDateTimestamp(date: string): number {
        return new Date(`${date}T00:00:00`).getTime();
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}