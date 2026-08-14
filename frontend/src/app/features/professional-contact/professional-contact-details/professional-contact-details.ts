import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProfessionalContactResponse, ProfessionalType } from '../../../core/models/professional-contact.models';

import { AuthService } from '../../../core/services/auth.service';
import { AppointmentRequestResponse } from '../../../core/models/appointment-request.models';
import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
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
    nextAppointment: AppointmentRequestResponse | null = null;
    hasOpenAppointmentRequest = false;

    patientId: number | null = null;
    contactId: number | null = null;

    isCoordinator = false;
    isLoading = true;
    errorMessage = '';

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly professionalContactService: ProfessionalContactService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly appointmentRequestService: AppointmentRequestService
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

                    this.loadNextAppointment();
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

    get nextAppointmentDateTime(): string | null {
        if (!this.nextAppointment) {
            return null;
        }

        if (
            this.nextAppointment.status ===
            'PARENT_ACCEPTED'
        ) {
            return this.nextAppointment.proposedDateTime;
        }

        return this.nextAppointment.requestedDateTime;
    }

    private loadNextAppointment(): void {
        if (this.contactId === null) {
            return;
        }

        const requests$ = this.isCoordinator
            ? this.appointmentRequestService
                .getCoordinatorRequests()
            : this.appointmentRequestService
                .getParentRequests();

        requests$.subscribe({
            next: requests => {
                this.nextAppointment =
                    this.findNextAppointment(requests);

                this.hasOpenAppointmentRequest =
                    this.hasOpenRequest(requests);

                this.refreshView();
            },
            error: () => {
                this.nextAppointment = null;
                this.hasOpenAppointmentRequest = false;
                this.refreshView();
            }
        });
    }

    private findNextAppointment(
        requests: AppointmentRequestResponse[]
    ): AppointmentRequestResponse | null {
        if (this.contactId === null) {
            return null;
        }

        const now = Date.now();

        const confirmedRequests = requests
            .filter(request =>
                request.professionalContactId ===
                    this.contactId &&
                (
                    request.status === 'APPROVED' ||
                    request.status === 'PARENT_ACCEPTED'
                )
            )
            .filter(request => {
                const dateTime =
                    request.status === 'PARENT_ACCEPTED'
                        ? request.proposedDateTime
                        : request.requestedDateTime;

                return (
                    dateTime !== null &&
                    new Date(dateTime).getTime() > now
                );
            })
            .sort((first, second) =>
                this.getAppointmentTimestamp(first) -
                this.getAppointmentTimestamp(second)
            );

        return confirmedRequests[0] ?? null;
    }

    private getAppointmentTimestamp(
        request: AppointmentRequestResponse
    ): number {
        const dateTime =
            request.status === 'PARENT_ACCEPTED'
                ? request.proposedDateTime
                : request.requestedDateTime;

        return dateTime
            ? new Date(dateTime).getTime()
            : Number.MAX_SAFE_INTEGER;
    }

    private hasOpenRequest( requests: AppointmentRequestResponse[]): boolean {
        if (this.contactId === null) {
            return false;
        }

        return requests.some(request =>
            request.professionalContactId ===
                this.contactId &&
            (
                request.status === 'PENDING' ||
                request.status ===
                    'RESCHEDULE_PROPOSED'
            )
        );
    }

    requestAppointment(): void {
        if (
            this.isCoordinator ||
            this.contactId === null
        ) {
            return;
        }

        this.router.navigate(
            ['/parent/appointments/create'],
            {
                queryParams: {
                    professionalContactId:
                        this.contactId
                }
            }
        );
    }
}