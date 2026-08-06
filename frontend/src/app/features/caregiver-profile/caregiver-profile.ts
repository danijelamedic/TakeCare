import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    OnInit
} from '@angular/core';
import { finalize } from 'rxjs';

import {
    UserResponse
} from '../../core/models/auth.models';
import {
    UserService
} from '../../core/services/user.service';

@Component({
    selector: 'app-caregiver-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './caregiver-profile.html',
    styleUrl: './caregiver-profile.scss'
})
export class CaregiverProfile implements OnInit {
    user: UserResponse | null = null;

    isLoading = true;
    errorMessage = '';

    constructor(
        private readonly userService: UserService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.userService
            .getCurrentUserProfile()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: user => {
                    this.user = user;
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to view this profile.';
                        return;
                    }

                    this.errorMessage =
                        'Your profile could not be loaded.';
                }
            });
    }

    get initials(): string {
        if (!this.user) {
            return '';
        }

        return (
            this.user.firstName.charAt(0) +
            this.user.lastName.charAt(0)
        ).toUpperCase();
    }

    formatRole(role: string): string {
        const labels: Record<string, string> = {
            PARENT: 'Caregiver',
            DOCTOR: 'Doctor',
            SUPPORT_COORDINATOR: 'Support coordinator'
        };

        return labels[role] ?? role;
    }
}