import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { UserResponse } from '../../core/models/auth.models';
import { CoordinatorSidebar } from '../../shared/components/coordinator-sidebar/coordinator-sidebar';

@Component({
    selector: 'app-coordinator-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        CoordinatorSidebar
    ],
    templateUrl: './coordinator-layout.html',
    styleUrl: './coordinator-layout.scss'
})
export class CoordinatorLayout {
    readonly user: UserResponse | null;

    isProfileMenuOpen = false;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {
        this.user = this.authService.getCurrentUser();
    }

    get initials(): string {
        if (!this.user) {
            return '';
        }

        return `${this.user.firstName.charAt(0)}${this.user.lastName.charAt(0)}`
            .toUpperCase();
    }

    toggleProfileMenu(): void {
        this.isProfileMenuOpen =
            !this.isProfileMenuOpen;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}