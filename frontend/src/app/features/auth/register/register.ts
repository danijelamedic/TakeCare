import { Component } from '@angular/core';
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

function passwordsMatchValidator(
    control: AbstractControl
): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
        return null;
    }

    return password === confirmPassword
        ? null
        : { passwordsDoNotMatch: true };
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink
    ],
    templateUrl: './register.html',
    styleUrl: './register.scss'
})
export class Register {
    showPassword = false;
    showConfirmPassword = false;
    submitted = false;
    isLoading = false;
    serverError = '';

    readonly registerForm;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly authService: AuthService,
        private readonly router: Router
    ) {
        this.registerForm = this.formBuilder.nonNullable.group(
            {
                firstName: [
                    '',
                    [
                        Validators.required,
                        Validators.maxLength(50)
                    ]
                ],
                lastName: [
                    '',
                    [
                        Validators.required,
                        Validators.maxLength(50)
                    ]
                ],
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
                        Validators.required,
                        Validators.minLength(8)
                    ]
                ],
                confirmPassword: [
                    '',
                    [
                        Validators.required
                    ]
                ]
            },
            {
                validators: passwordsMatchValidator
            }
        );
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    onSubmit(): void {
        this.submitted = true;
        this.serverError = '';

        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const {
            confirmPassword,
            ...formValue
        } = this.registerForm.getRawValue();

        const request = {
            ...formValue,
            role: 'PARENT'
        };

        this.isLoading = true;

        this.authService
            .register(request)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: () => {
                    this.router.navigate(['/parent']);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 409) {
                        this.serverError =
                            'An account with this email address already exists.';
                        return;
                    }

                    if (error.status === 400) {
                        this.serverError =
                            'Please check the entered information.';
                        return;
                    }

                    this.serverError =
                        'Unable to create the account. Please try again.';
                }
            });
    }
}