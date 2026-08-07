export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    token: string;
    tokenType: string;
    user: UserResponse;
}

export interface UpdateUserProfileRequest {
    firstName: string;
    lastName: string;
}