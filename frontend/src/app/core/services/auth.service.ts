import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse} from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly authUrl = `${environment.apiUrl}/auth`;

    private readonly tokenKey = 'takecare_token';
    private readonly userKey = 'takecare_user';

    constructor(private readonly http: HttpClient) {}

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${this.authUrl}/login`, request)
            .pipe(
                tap(response => this.storeSession(response))
            );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${this.authUrl}/register`, request)
            .pipe(
                tap(response => this.storeSession(response))
            );
    }

    logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    localStorage.removeItem('token');
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
}

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getCurrentUser(): UserResponse | null {
        const storedUser = localStorage.getItem(this.userKey);

        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser) as UserResponse;
        } catch {
            this.logout();
            return null;
        }
    }

    updateStoredUser(user: UserResponse): void {
        localStorage.setItem(
            this.userKey,
            JSON.stringify(user)
        );
    }

    isLoggedIn(): boolean {
        return Boolean(
            this.getToken() &&
            this.getCurrentUser()
        );
    }

    private storeSession(response: AuthResponse): void {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(
            this.userKey,
            JSON.stringify(response.user)
        );
    }
    
}