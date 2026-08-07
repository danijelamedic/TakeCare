import { Component } from '@angular/core';
import {
    Router,
    RouterLink,
    RouterLinkActive
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-coordinator-sidebar',
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive
    ],
    templateUrl: './coordinator-sidebar.html',
    styleUrl: './coordinator-sidebar.scss'
})
export class CoordinatorSidebar {
    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {}

    signOut(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}