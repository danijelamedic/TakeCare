import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';

@Component({
    selector: 'app-parent-home',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './parent-home.html',
    styleUrl: './parent-home.scss'
})
export class ParentHome implements OnInit {
    hasCareProfile = false;
    isCareProfileLoading = true;

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.checkCareProfile();
    }

    get firstName(): string {
        return (
            this.authService.getCurrentUser()?.firstName ||
            'there'
        );
    }

    get careProfileRoute(): string | null {
        if (this.isCareProfileLoading) {
            return null;
        }

        return this.hasCareProfile
            ? '/parent/care-profile'
            : '/parent/care-profile/create';
    }

    get careProfileActionLabel(): string {
        if (this.isCareProfileLoading) {
            return 'Loading...';
        }

        return this.hasCareProfile
            ? 'View profile'
            : 'Create profile';
    }

    private checkCareProfile(): void {
        this.isCareProfileLoading = true;

        this.patientService
            .getCurrentUserPatient()
            .pipe(
                finalize(() => {
                    this.isCareProfileLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.hasCareProfile = true;
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.hasCareProfile = false;
                        return;
                    }

                    console.error(
                        'Care profile check failed:',
                        error
                    );

                    this.hasCareProfile = false;
                }
            });
    }
}