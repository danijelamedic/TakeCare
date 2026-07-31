import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-parent-home',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './parent-home.html',
    styleUrl: './parent-home.scss'
})
export class ParentHome {
    constructor(private readonly authService: AuthService) {}

    get firstName(): string {
        return this.authService.getCurrentUser()?.firstName || 'there';
    }
}