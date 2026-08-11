import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProfessionalContactResponse, ProfessionalType } from '../../../core/models/professional-contact.models';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { ProfessionalContactService } from '../../../core/services/professional-contact.service';

@Component({
    selector: 'app-professional-contact-details',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './professional-contact-details.html',
    styleUrl: './professional-contact-details.scss'
})
export class ProfessionalContactDetails implements OnInit {

    professional: ProfessionalContactResponse | null = null;

    patientId: number | null = null;
    contactId: number | null = null;

    isCoordinator = false;
    isLoading = true;
    errorMessage = '';

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly professionalContactService:
            ProfessionalContactService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.initializePage();
    }

    get professionalsRoute(): string {
        return this.isCoordinator
            ? '/coordinator/professionals'
            : '/parent/professionals';
    }

    get professionalInitials(): string {
        if (!this.professional) {
            return '';
        }

        return (
            this.professional.firstName.charAt(0) +
            this.professional.lastName.charAt(0)
        ).toUpperCase();
    }

    private initializePage(): void {
        const currentUser = this.authService.getCurrentUser();

        if (!currentUser) {
            this.showError(
                'User information could not be loaded.'
            );
            return;
        }

        const role = currentUser.role?.toUpperCase() ?? '';

        this.isCoordinator = role.includes('COORDINATOR');

        const routeContactId = Number(
            this.activatedRoute.snapshot.paramMap.get('id')
        );

        if (
            !Number.isInteger(routeContactId) ||
            routeContactId <= 0
        ) {
            this.showError(
                'The selected professional is not valid.'
            );
            return;
        }

        this.contactId = routeContactId;

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
                this.loadProfessional();
            },
            error: () => {
                this.showError(
                    'Create a care profile before viewing professional details.'
                );
            }
        });
    }

    private loadAssignedPatient(): void {
        this.patientService.getAssignedPatient().subscribe({
            next: patient => {
                this.patientId = patient.id;
                this.loadProfessional();
            },
            error: () => {
                this.showError(
                    'No patient is currently assigned to you.'
                );
            }
        });
    }

    private loadProfessional(): void {
        if (
            this.patientId === null ||
            this.contactId === null
        ) {
            this.showError(
                'Professional details could not be loaded.'
            );
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.professionalContactService
            .getProfessionalDetails(
                this.contactId,
                this.patientId
            )
            .subscribe({
                next: professional => {
                    this.professional = professional;
                    this.isLoading = false;
                    this.refreshView();
                },
                error: error => {
                    this.professional = null;
                    this.showError(
                        error?.error?.message ||
                        'Professional details could not be loaded.'
                    );
                }
            });
    }

    goBack(): void {
        this.router.navigateByUrl(this.professionalsRoute);
    }

    getProfessionalTypeLabel(
        type: ProfessionalType
    ): string {
        const labels: Record<ProfessionalType, string> = {
            PEDIATRICIAN: 'Pediatrician',
            GENERAL_PRACTITIONER: 'General practitioner',
            NEUROLOGIST: 'Neurologist',
            PSYCHIATRIST: 'Psychiatrist',
            PSYCHOLOGIST: 'Psychologist',
            SPEECH_THERAPIST: 'Speech therapist',
            PHYSIOTHERAPIST: 'Physiotherapist',
            OCCUPATIONAL_THERAPIST:
                'Occupational therapist',
            SPECIAL_EDUCATION_TEACHER:
                'Special education teacher',
            SOCIAL_WORKER: 'Social worker',
            OTHER: 'Other'
        };

        return labels[type];
    }

    getProfessionalClass(
        type: ProfessionalType
    ): string {
        switch (type) {
            case 'PEDIATRICIAN':
            case 'GENERAL_PRACTITIONER':
            case 'NEUROLOGIST':
                return 'professional-medical';

            case 'PSYCHIATRIST':
            case 'PSYCHOLOGIST':
                return 'professional-mental-health';

            case 'SPEECH_THERAPIST':
            case 'PHYSIOTHERAPIST':
            case 'OCCUPATIONAL_THERAPIST':
            case 'SPECIAL_EDUCATION_TEACHER':
                return 'professional-therapy';

            case 'SOCIAL_WORKER':
            case 'OTHER':
            default:
                return 'professional-support';
        }
    }

    private showError(message: string): void {
        this.isLoading = false;
        this.errorMessage = message;
        this.refreshView();
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}