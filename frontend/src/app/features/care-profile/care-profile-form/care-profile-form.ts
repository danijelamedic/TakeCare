import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PatientRequest } from '../../../core/models/patient.models';
import { PatientService } from '../../../core/services/patient.service';

type CareProfileFormMode = 'create' | 'edit';

@Component({
    selector: 'app-care-profile-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './care-profile-form.html',
    styleUrl: './care-profile-form.scss'
})
export class CareProfileForm implements OnInit {
    mode: CareProfileFormMode = 'create';

    isLoading = false;
    isSubmitting = false;
    errorMessage = '';

    readonly genderOptions = [
        {
            value: 'MALE',
            label: 'Male'
        },
        {
            value: 'FEMALE',
            label: 'Female'
        },
        {
            value: 'OTHER',
            label: 'Other'
        },
        {
            value: 'NOT_SPECIFIED',
            label: 'Prefer not to say'
        }
    ];

    readonly bloodTypeOptions = [
        {
            value: 'UNKNOWN',
            label: 'Unknown'
        },
        {
            value: 'A_POSITIVE',
            label: 'A+'
        },
        {
            value: 'A_NEGATIVE',
            label: 'A-'
        },
        {
            value: 'B_POSITIVE',
            label: 'B+'
        },
        {
            value: 'B_NEGATIVE',
            label: 'B-'
        },
        {
            value: 'AB_POSITIVE',
            label: 'AB+'
        },
        {
            value: 'AB_NEGATIVE',
            label: 'AB-'
        },
        {
            value: 'O_POSITIVE',
            label: 'O+'
        },
        {
            value: 'O_NEGATIVE',
            label: 'O-'
        }
    ];

    careProfileForm!: FormGroup;
  
    constructor(
      private readonly formBuilder: FormBuilder,
      private readonly patientService: PatientService,
      private readonly route: ActivatedRoute,
      private readonly router: Router,
      private readonly changeDetectorRef: ChangeDetectorRef
  ) {
      this.careProfileForm = this.formBuilder.nonNullable.group({
          firstName: [
              '',
              [
                  Validators.required,
                  Validators.maxLength(100)
              ]
          ],
          lastName: [
              '',
              [
                  Validators.required,
                  Validators.maxLength(100)
              ]
          ],
          dateOfBirth: [
              '',
              Validators.required
          ],
          gender: [''],
          profileImage: [''],
          address: [''],
          emergencyContactName: [''],
          emergencyContactPhone: [''],
          bloodType: ['UNKNOWN'],
          allergies: [''],
          specialNeeds: [''],
          importantInformation: [''],
          generalNotes: ['']
      });
  }

    ngOnInit(): void {
        this.mode =
            this.route.snapshot.data['mode'] === 'edit'
                ? 'edit'
                : 'create';

        if (this.mode === 'edit') {
            this.loadPatient();
        }
    }

    get isEditMode(): boolean {
        return this.mode === 'edit';
    }

    get pageTitle(): string {
        return this.isEditMode
            ? 'Edit care profile'
            : 'Create a care profile';
    }

    get submitButtonLabel(): string {
        return this.isEditMode
            ? 'Save changes'
            : 'Create profile';
    }

    loadPatient(): void {
        this.isLoading = true;
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
                    this.careProfileForm.patchValue({
                        firstName: patient.firstName,
                        lastName: patient.lastName,
                        dateOfBirth: patient.dateOfBirth,
                        gender: patient.gender ?? '',
                        profileImage: patient.profileImage ?? '',
                        address: patient.address ?? '',
                        emergencyContactName:
                            patient.emergencyContactName ?? '',
                        emergencyContactPhone:
                            patient.emergencyContactPhone ?? '',
                        bloodType:
                            patient.bloodType ?? 'UNKNOWN',
                        allergies: patient.allergies ?? '',
                        specialNeeds: patient.specialNeeds ?? '',
                        importantInformation:
                            patient.importantInformation ?? '',
                        generalNotes: patient.generalNotes ?? ''
                    });
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.router.navigate([
                            '/parent/care-profile/create'
                        ]);
                        return;
                    }

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to edit this profile.';
                        return;
                    }

                    this.errorMessage =
                        'Care profile could not be loaded.';
                }
            });
    }

    submit(): void {
        if (this.careProfileForm.invalid) {
            this.careProfileForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const formValue = this.careProfileForm.getRawValue();

        const request: PatientRequest = {
            firstName: formValue.firstName.trim(),
            lastName: formValue.lastName.trim(),
            dateOfBirth: formValue.dateOfBirth,
            gender: this.toNullableValue(formValue.gender),
            profileImage:
                this.toNullableValue(formValue.profileImage),
            address: this.toNullableValue(formValue.address),
            emergencyContactName: this.toNullableValue(
                formValue.emergencyContactName
            ),
            emergencyContactPhone: this.toNullableValue(
                formValue.emergencyContactPhone
            ),
            bloodType:
                this.toNullableValue(formValue.bloodType),
            allergies:
                this.toNullableValue(formValue.allergies),
            specialNeeds:
                this.toNullableValue(formValue.specialNeeds),
            importantInformation: this.toNullableValue(
                formValue.importantInformation
            ),
            generalNotes:
                this.toNullableValue(formValue.generalNotes)
        };

        const request$ = this.isEditMode
            ? this.patientService.updateCurrentUserPatient(request)
            : this.patientService.createPatient(request);

        request$
            .pipe(
                finalize(() => {
                    this.isSubmitting = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.router.navigate([
                        '/parent/care-profile'
                    ]);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 400) {
                        this.errorMessage =
                            'Please check the entered information.';
                        return;
                    }

                    if (error.status === 409) {
                        this.errorMessage =
                            'A care profile has already been created.';
                        return;
                    }

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to save this profile.';
                        return;
                    }

                    this.errorMessage =
                        'Care profile could not be saved.';
                }
            });
    }

    cancel(): void {
        this.router.navigate([
            '/parent/care-profile'
        ]);
    }

    hasError(
        controlName: keyof typeof this.careProfileForm.controls,
        errorName: string
    ): boolean {
        const control =
            this.careProfileForm.controls[controlName];

        return (
            control.hasError(errorName) &&
            (control.touched || control.dirty)
        );
    }

    private toNullableValue(value: string): string | null {
        const trimmedValue = value.trim();

        return trimmedValue.length > 0
            ? trimmedValue
            : null;
    }
}