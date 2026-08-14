import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AppointmentRequestResponse, AppointmentRequestStatus } from '../../../core/models/appointment-request.models';

import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { AuthService } from '../../../core/services/auth.service';

type RequestFilter =
    | 'ALL'
    | 'PENDING'
    | 'RESCHEDULE_PROPOSED'
    | 'RESOLVED';

type CoordinatorAction =
    | 'REJECT'
    | 'PROPOSE_TIME';

@Component({
    selector: 'app-appointment-request-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './appointment-request-list.html',
    styleUrl: './appointment-request-list.scss'
})
export class AppointmentRequestList implements OnInit {

    requests: AppointmentRequestResponse[] = [];

    selectedFilter: RequestFilter = 'ALL';

    readonly filters: {
        label: string;
        value: RequestFilter;
    }[] = [
        {
            label: 'All',
            value: 'ALL'
        },
        {
            label: 'Pending',
            value: 'PENDING'
        },
        {
            label: 'New time proposed',
            value: 'RESCHEDULE_PROPOSED'
        },
        {
            label: 'Resolved',
            value: 'RESOLVED'
        }
    ];

    isCoordinator = false;
    isLoading = true;

    processingRequestId: number | null = null;
    activeActionRequestId: number | null = null;
    activeCoordinatorAction: CoordinatorAction | null = null;

    coordinatorComment = '';
    proposedDateTime = '';

    errorMessage = '';
    successMessage = '';

    readonly minimumDateTime =
        this.createMinimumDateTime();

    constructor(
        private readonly authService: AuthService,
        private readonly appointmentRequestService:
            AppointmentRequestService,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {

        const navigationState = history.state as { successMessage?: string; };

        if (navigationState.successMessage) {
            this.successMessage =
                navigationState.successMessage;

            history.replaceState(
                {},
                document.title,
                window.location.href
            );
        }
        const currentUser =
            this.authService.getCurrentUser();

        if (!currentUser) {
            this.isLoading = false;
            this.errorMessage =
                'User information could not be loaded.';
            this.refreshView();
            return;
        }

        const role =
            currentUser.role?.toUpperCase() ?? '';

        this.isCoordinator =
            role.includes('COORDINATOR');

        this.loadRequests();
    }

    get filteredRequests():
        AppointmentRequestResponse[] {

        if (this.selectedFilter === 'ALL') {
            return this.requests;
        }

        if (this.selectedFilter === 'RESOLVED') {
            return this.requests.filter(request =>
                request.status === 'APPROVED' ||
                request.status === 'REJECTED' ||
                request.status === 'PARENT_ACCEPTED' ||
                request.status === 'PARENT_REJECTED'
            );
        }

        return this.requests.filter(
            request =>
                request.status === this.selectedFilter
        );
    }

    loadRequests(): void {
        this.isLoading = true;
        this.errorMessage = '';

        const request$ = this.isCoordinator
            ? this.appointmentRequestService
                .getCoordinatorRequests()
            : this.appointmentRequestService
                .getParentRequests();

        request$.subscribe({
            next: requests => {
                this.requests =
                    this.sortRequests(requests);

                this.isLoading = false;
                this.refreshView();
            },
            error: () => {
                this.requests = [];
                this.isLoading = false;
                this.errorMessage =
                    'Appointment requests could not be loaded.';
                this.refreshView();
            }
        });
    }

    selectFilter(filter: RequestFilter): void {
        this.selectedFilter = filter;
        this.closeCoordinatorAction();
        this.clearMessages();
    }

    openCreateRequest(): void {
        if (this.isCoordinator) {
            return;
        }

        this.router.navigate([
            '/parent',
            'appointments',
            'create'
        ]);
    }

    approveRequest(
        request: AppointmentRequestResponse
    ): void {
        if (
            !this.isCoordinator ||
            request.status !== 'PENDING' ||
            this.processingRequestId !== null
        ) {
            return;
        }

        this.startProcessing(request.id);

        this.appointmentRequestService
            .approveRequest(request.id)
            .subscribe({
                next: updatedRequest => {
                    this.handleUpdatedRequest(
                        updatedRequest,
                        'The appointment request has been approved.'
                    );
                },
                error: () => {
                    this.handleActionError(
                        'The appointment request could not be approved.'
                    );
                }
            });
    }

    openRejectAction(
        request: AppointmentRequestResponse
    ): void {
        this.openCoordinatorAction(
            request,
            'REJECT'
        );
    }

    openProposeTimeAction(
        request: AppointmentRequestResponse
    ): void {
        this.openCoordinatorAction(
            request,
            'PROPOSE_TIME'
        );
    }

    submitRejection(
        request: AppointmentRequestResponse
    ): void {
        const comment =
            this.coordinatorComment.trim();

        if (!comment) {
            this.errorMessage =
                'Please enter a reason for rejecting the request.';
            return;
        }

        this.startProcessing(request.id);

        this.appointmentRequestService
            .rejectRequest(request.id, {
                coordinatorComment: comment
            })
            .subscribe({
                next: updatedRequest => {
                    this.handleUpdatedRequest(
                        updatedRequest,
                        'The appointment request has been rejected.'
                    );
                },
                error: () => {
                    this.handleActionError(
                        'The appointment request could not be rejected.'
                    );
                }
            });
    }

    submitProposedTime(
        request: AppointmentRequestResponse
    ): void {
        const comment =
            this.coordinatorComment.trim();

        if (!this.proposedDateTime) {
            this.errorMessage =
                'Please select a new date and time.';
            return;
        }

        if (
            new Date(this.proposedDateTime).getTime() <=
            Date.now()
        ) {
            this.errorMessage =
                'The proposed date and time must be in the future.';
            return;
        }

        if (!comment) {
            this.errorMessage =
                'Please explain why a new time is being proposed.';
            return;
        }

        this.startProcessing(request.id);

        this.appointmentRequestService
            .proposeNewTime(request.id, {
                proposedDateTime:
                    this.proposedDateTime,
                coordinatorComment: comment
            })
            .subscribe({
                next: updatedRequest => {
                    this.handleUpdatedRequest(
                        updatedRequest,
                        'A new appointment time has been proposed.'
                    );
                },
                error: () => {
                    this.handleActionError(
                        'The new appointment time could not be proposed.'
                    );
                }
            });
    }

    respondToProposal(
        request: AppointmentRequestResponse,
        accepted: boolean
    ): void {
        if (
            this.isCoordinator ||
            request.status !==
                'RESCHEDULE_PROPOSED' ||
            this.processingRequestId !== null
        ) {
            return;
        }

        this.startProcessing(request.id);

        this.appointmentRequestService
            .respondToProposedTime(
                request.id,
                accepted
            )
            .subscribe({
                next: updatedRequest => {
                    this.handleUpdatedRequest(
                        updatedRequest,
                        accepted
                            ? 'The proposed appointment time has been accepted.'
                            : 'The proposed appointment time has been declined.'
                    );
                },
                error: () => {
                    this.handleActionError(
                        'Your response could not be saved.'
                    );
                }
            });
    }

    closeCoordinatorAction(): void {
        this.activeActionRequestId = null;
        this.activeCoordinatorAction = null;
        this.coordinatorComment = '';
        this.proposedDateTime = '';
    }

    getStatusLabel(
        status: AppointmentRequestStatus
    ): string {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'APPROVED':
                return 'Approved';
            case 'REJECTED':
                return 'Rejected';
            case 'RESCHEDULE_PROPOSED':
                return 'New time proposed';
            case 'PARENT_ACCEPTED':
                return 'Proposed time accepted';
            case 'PARENT_REJECTED':
                return 'Proposed time declined';
        }
    }
  
  getProfessionLabel( profession: string | null | undefined ): string {
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

    trackRequestById(
        index: number,
        request: AppointmentRequestResponse
    ): number {
        return request.id;
    }

    private openCoordinatorAction(
        request: AppointmentRequestResponse,
        action: CoordinatorAction
    ): void {
        if (
            !this.isCoordinator ||
            request.status !== 'PENDING' ||
            this.processingRequestId !== null
        ) {
            return;
        }

        this.clearMessages();

        this.activeActionRequestId = request.id;
        this.activeCoordinatorAction = action;

        this.coordinatorComment = '';
        this.proposedDateTime = '';
    }

    private startProcessing(
        requestId: number
    ): void {
        this.clearMessages();
        this.processingRequestId = requestId;
    }

    private handleUpdatedRequest(
        updatedRequest: AppointmentRequestResponse,
        message: string
    ): void {
        this.requests = this.sortRequests(
            this.requests.map(request =>
                request.id === updatedRequest.id
                    ? updatedRequest
                    : request
            )
        );

        this.processingRequestId = null;
        this.successMessage = message;

        this.closeCoordinatorAction();
        this.refreshView();
    }

    private handleActionError(
        message: string
    ): void {
        this.processingRequestId = null;
        this.errorMessage = message;
        this.refreshView();
    }

    private sortRequests(
        requests: AppointmentRequestResponse[]
    ): AppointmentRequestResponse[] {
        return [...requests].sort(
            (first, second) => {
                const statusDifference =
                    this.getStatusOrder(first.status) -
                    this.getStatusOrder(second.status);

                if (statusDifference !== 0) {
                    return statusDifference;
                }

                return (
                    new Date(
                        second.createdAt
                    ).getTime() -
                    new Date(
                        first.createdAt
                    ).getTime()
                );
            }
        );
    }

    private getStatusOrder(
        status: AppointmentRequestStatus
    ): number {
        const order:
            Record<AppointmentRequestStatus, number> = {
                PENDING: 1,
                RESCHEDULE_PROPOSED: 2,
                APPROVED: 3,
                PARENT_ACCEPTED: 4,
                REJECTED: 5,
                PARENT_REJECTED: 6
            };

        return order[status];
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
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