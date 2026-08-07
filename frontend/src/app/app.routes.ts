import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/auth-layout/auth-layout';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ParentHome } from './features/parent-home/parent-home';
import { ParentLayout } from './layouts/parent-layout/parent-layout';
import { authGuard } from './core/guards/auth.guard';
import { CareProfile } from './features/care-profile/care-profile';
import { CareProfileForm } from './features/care-profile/care-profile-form/care-profile-form';
import { CaregiverProfile } from './features/caregiver-profile/caregiver-profile';
import { CoordinatorHome } from './features/coordinator-home/coordinator-home';
import { CoordinatorLayout } from './layouts/coordinator-layout/coordinator-layout';
import { SupportCoordinator } from './features/support-coordinator/support-coordinator';
import { AssignedPatient } from './features/assigned-patient/assigned-patient';

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
            },
            {
                path: 'care-profile/create',
                component: CareProfileForm,
                title: 'Create care profile | TakeCare',
                data: {
                    mode: 'create'
                }
            },
            {
                path: 'care-profile/edit',
                component: CareProfileForm,
                title: 'Edit care profile | TakeCare',
                data: {
                    mode: 'edit'
                }
            },
            {
                path: 'care-profile',
                component: CareProfile,
                title: 'Care profile | TakeCare'
            },
            {
                path: 'profile',
                component: CaregiverProfile,
                title: 'My profile | TakeCare'
            },
            {
                path: 'support-coordinator',
                component: SupportCoordinator,
                title: 'Support coordinator | TakeCare'
            },
        ]
    },
    {
        path: 'coordinator',
        component: CoordinatorLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: CoordinatorHome,
                title: 'Coordinator | TakeCare'
            },
            {
                path: 'patient',
                component: AssignedPatient,
                title: 'Assigned patient | TakeCare'
            },
            {
                path: 'profile',
                component: CaregiverProfile,
                title: 'My profile | TakeCare'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];