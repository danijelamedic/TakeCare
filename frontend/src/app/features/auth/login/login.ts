import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink, Router } from "@angular/router";
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./login.html",
  styleUrl: "./login.scss",
})
export class Login {
    showPassword = false;
    submitted = false;
    isLoading = false;
    serverError = '';

    readonly loginForm;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly authService: AuthService,
        private readonly router: Router
    ) {
        this.loginForm = this.formBuilder.nonNullable.group({
            email: [
                '',
                [
                    Validators.required,
                    Validators.email
                ]
            ],
            password: [
                '',
                [
                    Validators.required
                ]
            ]
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        this.submitted = true;
        this.serverError = '';

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;

        const request = this.loginForm.getRawValue();

        this.authService.login(request).subscribe({
            next: response => {
                console.log('Login successful:', response);

                this.isLoading = false;

                const targetRoute =
                    response.user.role === 'SUPPORT_COORDINATOR'
                        ? '/coordinator'
                        : '/parent';

                this.router.navigateByUrl(targetRoute).then(success => {
                    console.log('Navigation successful:', success);
                });
            },

            error: (error: HttpErrorResponse) => {
                console.error('Login error:', error);

                this.isLoading = false;

                if (error.status === 401) {
                    this.serverError =
                        'The email address or password is incorrect.';
                    return;
                }

                this.serverError =
                    'Unable to sign in. Please try again.';
            }
        });
    }
}
