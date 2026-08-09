import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

@Component({
    selector: 'app-parent-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        Sidebar,
        RouterLink
    ],
    templateUrl: './parent-layout.html',
    styleUrl: './parent-layout.scss'
})
export class ParentLayout {
    isProfileMenuOpen = false;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {}

    get user() {
        return this.authService.getCurrentUser();
    }

    toggleProfileMenu(): void {
        this.isProfileMenuOpen = !this.isProfileMenuOpen;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigateByUrl('/login', { replaceUrl:true });
    }

    get initials(): string {
        const firstName = this.user?.firstName?.trim();
        const lastName = this.user?.lastName?.trim();

        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
            .toUpperCase();
    }
}