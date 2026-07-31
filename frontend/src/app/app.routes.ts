import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/auth-layout/auth-layout';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ParentHome } from './features/parent-home/parent-home';
import { ParentLayout } from './layouts/parent-layout/parent-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: '',
        component: AuthLayout,
        children: [
            {
                path: 'login',
                component: Login,
                title: 'Sign in | TakeCare'
            },
            {
                path: 'register',
                component: Register,
                title: 'Create account | TakeCare'
            }
        ]
    },
    {
        path: 'parent',
        component: ParentLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: ParentHome,
                title: 'Home | TakeCare'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];