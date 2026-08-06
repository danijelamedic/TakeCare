import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserResponse } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly usersUrl =
        `${environment.apiUrl}/users`;

    constructor(
        private readonly http: HttpClient
    ) {}

    getCurrentUserProfile(): Observable<UserResponse> {
        return this.http.get<UserResponse>(
            `${this.usersUrl}/me`
        );
    }
}