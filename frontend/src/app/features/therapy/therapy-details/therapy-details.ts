import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TherapyIntakeResponse, TherapyResponse, TherapyStatus } from '../../../core/models/therapy.models';

import { AuthService } from '../../../core/services/auth.service';
import { TherapyService } from '../../../core/services/therapy.service';

@Component({
    selector: 'app-therapy-details',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './therapy-details.html',
    styleUrl: './therapy-details.scss'
})
export class TherapyDetails implements OnInit {

    therapy: TherapyResponse | null = null;
    intakes: TherapyIntakeResponse[] = [];

    isCoordinator = false;
    isLoading = true;
    isUpdatingStatus = false;

    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly therapyService: TherapyService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.initializeRole();
        this.loadTherapyDetails();
    }

    private initializeRole(): void {
        const currentUser = this.authService.getCurrentUser();
        const role = currentUser?.role?.toUpperCase() ?? '';

        this.isCoordinator = role.includes('COORDINATOR');
    }

    private loadTherapyDetails(): void {
        const therapyId = Number(
            this.route.snapshot.paramMap.get('id')
        );

        if (!Number.isInteger(therapyId) || therapyId <= 0) {
            this.isLoading = false;
            this.errorMessage = 'Invalid therapy identifier.';
            this.refreshView();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        forkJoin({
            therapy: this.therapyService.getTherapyById(therapyId),
            intakes: this.therapyService.getTherapyIntakes(therapyId)
        }).subscribe({
            next: result => {
                this.therapy = result.therapy;

                this.intakes = [...result.intakes].sort(
                    (first, second) =>
                        new Date(second.scheduledAt).getTime() -
                        new Date(first.scheduledAt).getTime()
                );

                this.isLoading = false;
                this.refreshView();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'Therapy details could not be loaded.';
                this.refreshView();
            }
        });
    }

    goBack(): void {
        this.router.navigate([
            this.getRoutePrefix(),
            'therapies'
        ]);
    }

    openEditTherapy(): void {
        if (!this.therapy) {
            return;
        }

        this.router.navigate([
            this.getRoutePrefix(),
            'therapies',
            this.therapy.id,
            'edit'
        ]);
    }

    openIntakeForm(): void {
        if (!this.therapy || this.isCoordinator) {
            return;
        }

        this.router.navigate([
            this.getRoutePrefix(),
            'therapies',
            this.therapy.id,
            'intakes',
            'create'
        ]);
    }

    updateStatus(status: TherapyStatus): void {
        if (
            !this.therapy ||
            this.therapy.status === status ||
            this.isUpdatingStatus
        ) {
            return;
        }

        this.clearMessages();
        this.isUpdatingStatus = true;

        this.therapyService
            .updateTherapyStatus(this.therapy.id, status)
            .subscribe({
                next: updatedTherapy => {
                    this.therapy = updatedTherapy;
                    this.isUpdatingStatus = false;
                    this.successMessage =
                        'Therapy status has been updated.';
                    this.refreshView();
                },
                error: () => {
                    this.isUpdatingStatus = false;
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

    getDayLabel(day: string): string {
        const labels: Record<string, string> = {
            MONDAY: 'Monday',
            TUESDAY: 'Tuesday',
            WEDNESDAY: 'Wednesday',
            THURSDAY: 'Thursday',
            FRIDAY: 'Friday',
            SATURDAY: 'Saturday',
            SUNDAY: 'Sunday'
        };

        return labels[day] ?? day;
    }

    formatScheduleDays(days: string[]): string {
        if (!days || days.length === 0) {
            return 'No days specified';
        }

        const dayOrder = [
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
            'SUNDAY'
        ];

        return [...days]
            .sort(
                (firstDay, secondDay) =>
                    dayOrder.indexOf(firstDay) -
                    dayOrder.indexOf(secondDay)
            )
            .map(day => this.getDayLabel(day))
            .join(', ');
    }

    formatTime(time: string): string {
        return time?.substring(0, 5) || 'Not specified';
    }

    trackScheduleById(
        index: number,
        schedule: TherapyResponse['schedules'][number]
    ): number {
        return schedule.id;
    }

    trackIntakeById(
        index: number,
        intake: TherapyIntakeResponse
    ): number {
        return intake.id;
    }

    private getRoutePrefix(): string {
        return this.isCoordinator
            ? '/coordinator'
            : '/parent';
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}