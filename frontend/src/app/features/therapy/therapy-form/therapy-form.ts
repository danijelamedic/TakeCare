import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { TherapyService } from '../../../core/services/therapy.service';

import { DayOfWeek, TherapyRequest, TherapyResponse, TherapyStatus } from '../../../core/models/therapy.models';

interface DayOption {
    label: string;
    value: DayOfWeek;
}

@Component({
    selector: 'app-therapy-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './therapy-form.html',
    styleUrl: './therapy-form.scss'
})
export class TherapyForm implements OnInit {

    readonly dayOptions: DayOption[] = [
        { label: 'Monday', value: 'MONDAY' },
        { label: 'Tuesday', value: 'TUESDAY' },
        { label: 'Wednesday', value: 'WEDNESDAY' },
        { label: 'Thursday', value: 'THURSDAY' },
        { label: 'Friday', value: 'FRIDAY' },
        { label: 'Saturday', value: 'SATURDAY' },
        { label: 'Sunday', value: 'SUNDAY' }
    ];

    therapyForm: FormGroup;

    patientId: number | null = null;
    therapyId: number | null = null;

    isCoordinator = false;
    isEditMode = false;
    isLoading = true;
    isSubmitting = false;

    errorMessage = '';
    successMessage = '';

    private existingTherapy: TherapyResponse | null = null;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly therapyService: TherapyService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {
        this.therapyForm = this.formBuilder.group({
            name: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(150)
                ]
            ],
            description: [
                '',
                Validators.maxLength(1000)
            ],
            dosage: [
                '',
                Validators.maxLength(150)
            ],
            frequency: [
                '',
                Validators.maxLength(150)
            ],
            instructions: [
                '',
                Validators.maxLength(1000)
            ],
            startDate: [
                '',
                Validators.required
            ],
            endDate: [''],
            notes: [
                '',
                Validators.maxLength(1000)
            ],
            schedules: this.formBuilder.array([])
        });
    }

    ngOnInit(): void {
        this.initializeForm();
    }

    get schedules(): FormArray {
        return this.therapyForm.get('schedules') as FormArray;
    }

    get pageTitle(): string {
        return this.isEditMode
            ? 'Edit therapy'
            : 'Add therapy';
    }

    get submitButtonLabel(): string {
        if (this.isSubmitting) {
            return this.isEditMode
                ? 'Saving changes...'
                : 'Creating therapy...';
        }

        return this.isEditMode
            ? 'Save changes'
            : 'Create therapy';
    }

    private initializeForm(): void {
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

        const therapyIdParameter =
            this.activatedRoute.snapshot.paramMap.get('id');

        if (therapyIdParameter !== null) {
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
            this.isEditMode = true;
        }

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
                this.continueInitialization();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'Create a care profile before managing therapies.';
                this.refreshView();
            }
        });
    }

    private loadAssignedPatient(): void {
        this.patientService.getAssignedPatient().subscribe({
            next: patient => {
                this.patientId = patient.id;
                this.continueInitialization();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'No patient is currently assigned to you.';
                this.refreshView();
            }
        });
    }

    private continueInitialization(): void {
        if (
            this.isEditMode &&
            this.therapyId !== null
        ) {
            this.loadTherapy();
            return;
        }

        this.addSchedule();
        this.isLoading = false;
        this.refreshView();
    }

    private loadTherapy(): void {
        if (this.therapyId === null) {
            return;
        }

        this.therapyService
            .getTherapyById(this.therapyId)
            .subscribe({
                next: therapy => {
                    if (therapy.patientId !== this.patientId) {
                        this.isLoading = false;
                        this.errorMessage =
                            'You cannot edit this therapy.';
                        this.refreshView();
                        return;
                    }

                    this.existingTherapy = therapy;
                    this.populateForm(therapy);
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

    private populateForm(therapy: TherapyResponse): void {
        this.therapyForm.patchValue({
            name: therapy.name,
            description: therapy.description ?? '',
            dosage: therapy.dosage ?? '',
            frequency: therapy.frequency ?? '',
            instructions: therapy.instructions ?? '',
            startDate: therapy.startDate,
            endDate: therapy.endDate ?? '',
            notes: therapy.notes ?? ''
        });

        this.schedules.clear();

        therapy.schedules.forEach(schedule => {
            this.schedules.push(
                this.createScheduleGroup({
                    time: schedule.time.substring(0, 5),
                    daysOfWeek: schedule.daysOfWeek,
                    frequencyDescription:
                        schedule.frequencyDescription ?? '',
                    startDate: schedule.startDate,
                    endDate: schedule.endDate ?? '',
                    instructions: schedule.instructions ?? ''
                })
            );
        });

        if (this.schedules.length === 0) {
            this.addSchedule();
        }
    }

    private createScheduleGroup(
        values?: {
            time?: string;
            daysOfWeek?: DayOfWeek[];
            frequencyDescription?: string;
            startDate?: string;
            endDate?: string;
            instructions?: string;
        }
    ): FormGroup {
        return this.formBuilder.group({
            time: [
                values?.time ?? '',
                Validators.required
            ],
            daysOfWeek: [
                values?.daysOfWeek ?? [],
                Validators.required
            ],
            frequencyDescription: [
                values?.frequencyDescription ?? '',
                Validators.maxLength(250)
            ],
            startDate: [
                values?.startDate ??
                    this.therapyForm.get('startDate')?.value ??
                    '',
                Validators.required
            ],
            endDate: [
                values?.endDate ?? ''
            ],
            instructions: [
                values?.instructions ?? '',
                Validators.maxLength(1000)
            ]
        });
    }

    addSchedule(): void {
        this.schedules.push(this.createScheduleGroup());
    }

    removeSchedule(index: number): void {
        if (this.schedules.length === 1) {
            return;
        }

        this.schedules.removeAt(index);
    }

    isDaySelected(
        scheduleIndex: number,
        day: DayOfWeek
    ): boolean {
        const selectedDays =
            this.schedules
                .at(scheduleIndex)
                .get('daysOfWeek')
                ?.value as DayOfWeek[] | null;

        return selectedDays?.includes(day) ?? false;
    }

    toggleScheduleDay(
        scheduleIndex: number,
        day: DayOfWeek
    ): void {
        const daysControl =
            this.schedules
                .at(scheduleIndex)
                .get('daysOfWeek');

        if (!daysControl) {
            return;
        }

        const selectedDays =
            (daysControl.value as DayOfWeek[] | null) ?? [];

        const updatedDays = selectedDays.includes(day)
            ? selectedDays.filter(
                selectedDay => selectedDay !== day
            )
            : [...selectedDays, day];

        daysControl.setValue(updatedDays);
        daysControl.markAsTouched();
        daysControl.markAsDirty();
    }

    submitForm(): void {
        this.clearMessages();

        if (
            this.patientId === null ||
            this.isSubmitting
        ) {
            return;
        }

        this.therapyForm.markAllAsTouched();

        if (this.therapyForm.invalid) {
            this.errorMessage =
                'Please complete all required fields.';
            this.scrollToTop();
            return;
        }

        if (!this.areDateRangesValid()) {
            this.scrollToTop();
            return;
        }

        const request = this.buildRequest();

        this.isSubmitting = true;
        this.therapyForm.disable();
        this.refreshView();

        if (
            this.isEditMode &&
            this.therapyId !== null
        ) {
            this.updateTherapy(request);
        } else {
            this.createTherapy(request);
        }
    }

    private buildRequest(): TherapyRequest {
        const formValue = this.therapyForm.getRawValue();

        const status: TherapyStatus =
            this.existingTherapy?.status ?? 'ACTIVE';

        return {
            patientId: this.patientId as number,
            name: formValue.name.trim(),
            description: this.toNullableText(
                formValue.description
            ),
            dosage: this.toNullableText(
                formValue.dosage
            ),
            frequency: this.toNullableText(
                formValue.frequency
            ),
            instructions: this.toNullableText(
                formValue.instructions
            ),
            startDate: formValue.startDate,
            endDate: formValue.endDate || null,
            status,
            prescribedById:
                this.existingTherapy?.prescribedById ?? null,
            notes: this.toNullableText(
                formValue.notes
            ),
            schedules: formValue.schedules.map(
                (schedule: {
                    time: string;
                    daysOfWeek: DayOfWeek[];
                    frequencyDescription: string;
                    startDate: string;
                    endDate: string;
                    instructions: string;
                }) => ({
                    time: schedule.time,
                    daysOfWeek: schedule.daysOfWeek,
                    frequencyDescription:
                        this.toNullableText(
                            schedule.frequencyDescription
                        ),
                    startDate: schedule.startDate,
                    endDate: schedule.endDate || null,
                    instructions:
                        this.toNullableText(
                            schedule.instructions
                        )
                })
            )
        };
    }

    private createTherapy(request: TherapyRequest): void {
        this.therapyService.createTherapy(request).subscribe({
            next: therapy => {
                this.handleSuccessfulSave(therapy);
            },
            error: () => {
                this.handleSaveError(
                    'Therapy could not be created.'
                );
            }
        });
    }

    private updateTherapy(request: TherapyRequest): void {
        if (this.therapyId === null) {
            return;
        }

        this.therapyService
            .updateTherapy(this.therapyId, request)
            .subscribe({
                next: therapy => {
                    this.handleSuccessfulSave(therapy);
                },
                error: () => {
                    this.handleSaveError(
                        'Therapy changes could not be saved.'
                    );
                }
            });
    }

    private handleSuccessfulSave(
        therapy: TherapyResponse
    ): void {
        const routePrefix = this.getRoutePrefix();

        this.router.navigate([
            routePrefix,
            'therapies',
            therapy.id
        ]);
    }

    private handleSaveError(message: string): void {
        this.isSubmitting = false;
        this.therapyForm.enable();
        this.errorMessage = message;
        this.scrollToTop();
        this.refreshView();
    }

    private areDateRangesValid(): boolean {
        const therapyStartDate =
            this.therapyForm.get('startDate')?.value;
        const therapyEndDate =
            this.therapyForm.get('endDate')?.value;

        if (
            therapyEndDate &&
            therapyEndDate < therapyStartDate
        ) {
            this.errorMessage =
                'Therapy end date cannot be before its start date.';
            return false;
        }

        for (
            let index = 0;
            index < this.schedules.length;
            index++
        ) {
            const schedule = this.schedules.at(index);
            const scheduleStartDate =
                schedule.get('startDate')?.value;
            const scheduleEndDate =
                schedule.get('endDate')?.value;

            if (
                scheduleEndDate &&
                scheduleEndDate < scheduleStartDate
            ) {
                this.errorMessage =
                    `Schedule ${index + 1} has an invalid date range.`;
                return false;
            }

            if (scheduleStartDate < therapyStartDate) {
                this.errorMessage =
                    `Schedule ${index + 1} cannot start before the therapy.`;
                return false;
            }

            if (
                therapyEndDate &&
                (
                    scheduleStartDate > therapyEndDate ||
                    (
                        scheduleEndDate &&
                        scheduleEndDate > therapyEndDate
                    )
                )
            ) {
                this.errorMessage =
                    `Schedule ${index + 1} must remain within the therapy period.`;
                return false;
            }
        }

        return true;
    }

    cancel(): void {
        const routePrefix = this.getRoutePrefix();

        if (
            this.isEditMode &&
            this.therapyId !== null
        ) {
            this.router.navigate([
                routePrefix,
                'therapies',
                this.therapyId
            ]);
            return;
        }

        this.router.navigate([
            routePrefix,
            'therapies'
        ]);
    }

    goBack(): void {
        this.cancel();
    }

    hasError(
        controlName: string,
        errorName?: string
    ): boolean {
        const control =
            this.therapyForm.get(controlName);

        if (
            !control ||
            !(control.touched || control.dirty)
        ) {
            return false;
        }

        return errorName
            ? control.hasError(errorName)
            : control.invalid;
    }

    scheduleHasError(
        scheduleIndex: number,
        controlName: string,
        errorName?: string
    ): boolean {
        const control =
            this.schedules
                .at(scheduleIndex)
                .get(controlName);

        if (
            !control ||
            !(control.touched || control.dirty)
        ) {
            return false;
        }

        return errorName
            ? control.hasError(errorName)
            : control.invalid;
    }

    private toNullableText(
        value: string | null | undefined
    ): string | null {
        const normalizedValue = value?.trim();

        return normalizedValue
            ? normalizedValue
            : null;
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

    private scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}