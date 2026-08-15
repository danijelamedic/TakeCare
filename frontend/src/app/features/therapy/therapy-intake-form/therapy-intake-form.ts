import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TherapyIntakeRequest, TherapyIntakeStatus, TherapyResponse } from '../../../core/models/therapy.models';

import { TherapyService } from '../../../core/services/therapy.service';

@Component({
    selector: 'app-therapy-intake-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './therapy-intake-form.html',
    styleUrl: './therapy-intake-form.scss'
})
export class TherapyIntakeForm implements OnInit {

    intakeForm: FormGroup;

    therapy: TherapyResponse | null = null;
    therapyId: number | null = null;

    isLoading = true;
    isSubmitting = false;

    errorMessage = '';

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly therapyService: TherapyService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {
        const currentDateTime = this.getCurrentLocalDateTime();

        this.intakeForm = this.formBuilder.group({
            scheduledAt: [
                currentDateTime,
                Validators.required
            ],
            status: [
                'TAKEN' as TherapyIntakeStatus,
                Validators.required
            ],
            takenAt: [currentDateTime],
            notes: [
                '',
                Validators.maxLength(1000)
            ]
        });
    }

    ngOnInit(): void {
        this.initializeForm();

        this.intakeForm
            .get('status')
            ?.valueChanges
            .subscribe((status: TherapyIntakeStatus) => {
                this.handleStatusChange(status);
            });
    }

    get isTaken(): boolean {
        return this.intakeForm.get('status')?.value === 'TAKEN';
    }

    get submitButtonLabel(): string {
        return this.isSubmitting
            ? 'Saving intake...'
            : 'Save intake';
    }

    private initializeForm(): void {
        const therapyIdParameter =
            this.activatedRoute.snapshot.paramMap.get('id');

        const parsedTherapyId = Number(therapyIdParameter);

        if (
            !Number.isInteger(parsedTherapyId) ||
            parsedTherapyId <= 0
        ) {
            this.isLoading = false;
            this.errorMessage = 'Invalid therapy identifier.';
            this.refreshView();
            return;
        }

        this.therapyId = parsedTherapyId;
        this.loadTherapy();
    }

    private loadTherapy(): void {
        if (this.therapyId === null) {
            return;
        }

        this.therapyService
            .getTherapyById(this.therapyId)
            .subscribe({
                next: therapy => {
                    this.therapy = therapy;
                    this.isLoading = false;
                    this.refreshView();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'Therapy could not be loaded.';
                    this.refreshView();
                }
            });
    }

    private handleStatusChange(
        status: TherapyIntakeStatus
    ): void {
        const takenAtControl =
            this.intakeForm.get('takenAt');

        if (status === 'TAKEN') {
            if (!takenAtControl?.value) {
                takenAtControl?.setValue(
                    this.getCurrentLocalDateTime()
                );
            }

            return;
        }

        takenAtControl?.setValue('');
    }

    submitForm(): void {
        if (
            this.intakeForm.invalid ||
            this.therapyId === null ||
            this.isSubmitting
        ) {
            this.intakeForm.markAllAsTouched();
            return;
        }

        this.errorMessage = '';
        this.isSubmitting = true;

        const formValue = this.intakeForm.getRawValue();

        const request: TherapyIntakeRequest = {
            scheduledAt: formValue.scheduledAt,
            status: formValue.status,
            takenAt:
                formValue.status === 'TAKEN'
                    ? formValue.takenAt || null
                    : null,
            notes: this.normalizeOptionalText(
                formValue.notes
            )
        };

        this.therapyService
            .createIntake(this.therapyId, request)
            .subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.navigateToTherapyDetails();
                },
                error: error => {
                    this.isSubmitting = false;

                    this.errorMessage =
                        error.error?.message ??
                        'Therapy intake could not be recorded.';

                    this.refreshView();
                }
            });
    }

    cancel(): void {
        this.navigateToTherapyDetails();
    }

    goBack(): void {
        this.navigateToTherapyDetails();
    }

    private navigateToTherapyDetails(): void {
        if (this.therapyId === null) {
            this.router.navigate([
                this.getRoutePrefix(),
                'therapies'
            ]);
            return;
        }

        this.router.navigate([
            this.getRoutePrefix(),
            'therapies',
            this.therapyId
        ]);
    }

    private getRoutePrefix(): string {
        return this.router.url.startsWith('/coordinator')
            ? '/coordinator'
            : '/parent';
    }

    private getCurrentLocalDateTime(): string {
        const currentDate = new Date();
        const timezoneOffset =
            currentDate.getTimezoneOffset() * 60_000;

        return new Date(
            currentDate.getTime() - timezoneOffset
        )
            .toISOString()
            .slice(0, 16);
    }

    private normalizeOptionalText(
        value: string | null | undefined
    ): string | null {
        const normalizedValue = value?.trim();

        return normalizedValue
            ? normalizedValue
            : null;
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}