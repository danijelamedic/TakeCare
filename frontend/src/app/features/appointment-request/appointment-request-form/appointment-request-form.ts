import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { ProfessionalContactResponse } from '../../../core/models/professional-contact.models';

import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { PatientService } from '../../../core/services/patient.service';
import { ProfessionalContactService } from '../../../core/services/professional-contact.service';

@Component({
    selector: 'app-appointment-request-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './appointment-request-form.html',
    styleUrl: './appointment-request-form.scss'
})
export class AppointmentRequestForm implements OnInit {

    professionals: ProfessionalContactResponse[] = [];

    patientId: number | null = null;

    isLoading = true;
    isSubmitting = false;

    errorMessage = '';
    
    private readonly formBuilder = inject(FormBuilder);

    readonly minimumDateTime = this.createMinimumDateTime();

    readonly requestForm = this.formBuilder.group({
        professionalContactId: [
            null as number | null,
            Validators.required
        ],
        requestedDateTime: [
            '',
            Validators.required
        ],
        reason: [
            '',
            [
                Validators.required,
                Validators.maxLength(1000)
            ]
        ]
    });

    constructor(
        private readonly patientService: PatientService,
        private readonly professionalContactService: ProfessionalContactService,
        private readonly appointmentRequestService: AppointmentRequestService,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadPatientAndProfessionals();
    }

    get professionalContactIdControl() {
        return this.requestForm.controls
            .professionalContactId;
    }

    get requestedDateTimeControl() {
        return this.requestForm.controls
            .requestedDateTime;
    }

    get reasonControl() {
        return this.requestForm.controls.reason;
    }

    submit(): void {
        this.errorMessage = '';

        if (this.requestForm.invalid) {
            this.requestForm.markAllAsTouched();
            return;
        }

        const formValue =
            this.requestForm.getRawValue();

        if (
            formValue.professionalContactId === null ||
            !formValue.requestedDateTime
        ) {
            this.requestForm.markAllAsTouched();
            return;
        }

        const selectedDate =
            new Date(formValue.requestedDateTime);

        if (
            Number.isNaN(selectedDate.getTime()) ||
            selectedDate.getTime() <= Date.now()
        ) {
            this.requestedDateTimeControl.setErrors({
                notFuture: true
            });
            return;
        }

        const reason = formValue.reason?.trim() ?? '';

        if (!reason) {
            this.reasonControl.setErrors({
                required: true
            });
            return;
        }

        this.isSubmitting = true;
        this.requestForm.disable();

        this.appointmentRequestService
            .createRequest({
                professionalContactId:
                    formValue.professionalContactId,
                requestedDateTime:
                    formValue.requestedDateTime,
                reason
            })
            .subscribe({
                next: () => {
                    this.router.navigate(
                        ['/parent/appointments'],
                        {
                            state: {
                                successMessage:
                                    'The appointment request has been created.'
                            }
                        }
                    );
                },
                error: error => {
                    this.isSubmitting = false;
                    this.requestForm.enable();

                    this.errorMessage =
                        this.getCreateErrorMessage(error);

                    this.refreshView();
                }
            });
    }

    cancel(): void {
        this.router.navigate([
            '/parent',
            'appointments'
        ]);
    }

    getProfessionLabel(
        profession: string | null | undefined
    ): string {
        if (!profession) {
            return 'Professional';
        }

        return profession
            .toLowerCase()
            .split('_')
            .map((word, index) =>
                index === 0
                    ? word.charAt(0).toUpperCase() +
                        word.slice(1)
                    : word
            )
            .join(' ');
    }

    private loadPatientAndProfessionals(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.patientService
            .getCurrentUserPatient()
            .subscribe({
                next: patient => {
                    this.patientId = patient.id;
                    this.loadProfessionals(patient.id);
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'Create a care profile before requesting an appointment.';
                    this.refreshView();
                }
            });
    }

    private loadProfessionals(
        patientId: number
    ): void {
        this.professionalContactService
            .getProfessionalsForPatient(patientId)
            .subscribe({
                next: professionals => {
                    this.professionals =
                        [...professionals].sort(
                            (first, second) =>
                                first.fullName.localeCompare(
                                    second.fullName
                                )
                      );
                    const requestedProfessionalId = Number(
                        this.activatedRoute.snapshot.queryParamMap.get(
                            'professionalContactId'
                        )
                    );

                    const isConnectedProfessional =
                        this.professionals.some(
                            professional =>
                                professional.id ===
                                requestedProfessionalId
                        );

                    if (
                        Number.isInteger(requestedProfessionalId) &&
                        isConnectedProfessional
                    ) {
                        this.professionalContactIdControl.setValue(
                            requestedProfessionalId
                        );
                    }

                    this.isLoading = false;
                    this.refreshView();
                },
                error: () => {
                    this.professionals = [];
                    this.isLoading = false;
                    this.errorMessage =
                        'Professionals could not be loaded.';
                    this.refreshView();
                }
            });
    }

    private getCreateErrorMessage(
        error: {
            status?: number;
            error?: {
                message?: string;
            };
        }
    ): string {
        if (error.status === 401) {
            return 'Your session has expired. Please sign in again.';
        }

        if (error.status === 403) {
            return 'You are not allowed to create this request.';
        }

        if (error.status === 400) {
            return error.error?.message ||
                'Check the entered appointment information.';
        }

        return error.error?.message ||
            'The appointment request could not be created.';
    }

    private createMinimumDateTime(): string {
        const date = new Date();

        date.setMinutes(
            date.getMinutes() -
            date.getTimezoneOffset()
        );

        return date
            .toISOString()
            .slice(0, 16);
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}