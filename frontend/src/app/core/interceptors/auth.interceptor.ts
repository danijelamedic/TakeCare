import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const token = localStorage.getItem('takecare_token');

    if (!token) {
        return next(request);
    }

    const authenticatedRequest = request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(authenticatedRequest);
};