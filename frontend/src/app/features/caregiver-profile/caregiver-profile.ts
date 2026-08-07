import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { UpdateUserProfileRequest, UserResponse } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-caregiver-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './caregiver-profile.html',
    styleUrl: './caregiver-profile.scss'
})
export class CaregiverProfile implements OnInit {
    user: UserResponse | null = null;

    isLoading = true;
    isEditing = false;
    isSaving = false;

    errorMessage = '';
    successMessage = '';

    editFirstName = '';
    editLastName = '';

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

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
                    this.setEditValues(user);
                },
                error: (error: HttpErrorResponse) => {
                    this.handleLoadError(error);
                }
            });
    }

    startEditing(): void {
        if (!this.user) {
            return;
        }

        this.setEditValues(this.user);

        this.errorMessage = '';
        this.successMessage = '';
        this.isEditing = true;
    }

    cancelEditing(): void {
        if (this.user) {
            this.setEditValues(this.user);
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.isEditing = false;
    }

    saveProfile(): void {
        if (this.isSaving) {
            return;
        }

        const firstName = this.editFirstName.trim();
        const lastName = this.editLastName.trim();

        if (!firstName || !lastName) {
            this.errorMessage =
                'First name and last name are required.';
            return;
        }

        if (firstName.length > 100 || lastName.length > 100) {
            this.errorMessage =
                'First name and last name must not exceed 100 characters.';
            return;
        }

        const request: UpdateUserProfileRequest = {
            firstName,
            lastName
        };

        this.isSaving = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.userService
            .updateCurrentUserProfile(request)
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: updatedUser => {
                    this.user = updatedUser;
                    this.setEditValues(updatedUser);

                    this.authService.updateStoredUser(updatedUser);

                    this.isEditing = false;
                    this.successMessage =
                        'Your profile has been updated successfully.';
                },
                error: (error: HttpErrorResponse) => {
                    this.handleUpdateError(error);
                }
            });
    }

    private setEditValues(user: UserResponse): void {
        this.editFirstName = user.firstName;
        this.editLastName = user.lastName;
    }

    private handleLoadError(error: HttpErrorResponse): void {
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

    private handleUpdateError(error: HttpErrorResponse): void {
        if (error.status === 400) {
            this.errorMessage =
                'Please check the entered information.';
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
            'Your profile could not be updated.';
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