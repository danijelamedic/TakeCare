import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive} from '@angular/router';

import {
    AuthService
} from '../../../core/services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive
    ],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.scss'
})
export class Sidebar {
    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {}

    signOut(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}