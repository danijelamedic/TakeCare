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
import { Diary } from './features/diary/diary';
import { TherapyList } from './features/therapy/therapy-list/therapy-list';
import { ProfessionalContactList } from './features/professional-contact/professional-contact-list/professional-contact-list';
import { ProfessionalContactDetails } from './features/professional-contact/professional-contact-details/professional-contact-details';

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
            {
                path: 'diary',
                component: Diary
            },
            {
                path: 'therapies',
                component: TherapyList,
                title: 'Therapies | TakeCare'
            },
            {
                path: 'therapies/create',
                loadComponent: () =>
                    import(
                        './features/therapy/therapy-form/therapy-form'
                    ).then(component => component.TherapyForm),
                title: 'Add therapy | TakeCare'
            },
            {
                path: 'therapies/:id/edit',
                loadComponent: () =>
                    import(
                        './features/therapy/therapy-form/therapy-form'
                    ).then(component => component.TherapyForm),
                title: 'Edit therapy | TakeCare'
            },
            {
                path: 'therapies/:id',
                loadComponent: () =>
                    import('./features/therapy/therapy-details/therapy-details').then(component => component.TherapyDetails),
                title: 'Therapy details | TakeCare'
            },
            {
                path: 'therapies/:id/intakes/create',
                loadComponent: () =>
                    import(
                        './features/therapy/therapy-intake-form/therapy-intake-form'
                    ).then(component => component.TherapyIntakeForm),
                title: 'Record intake | TakeCare'
            },
            {
                path: 'professionals',
                component: ProfessionalContactList,
                title: 'Professionals | TakeCare'
            },
            {
                path: 'professionals/:id',
                component: ProfessionalContactDetails,
                title: 'Professional details | TakeCare'
            }
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
            },
            {
                path: 'diary',
                component: Diary
            },
            {
                path: 'therapies',
                component: TherapyList,
                title: 'Therapies | TakeCare'
            },
            {
                path: 'therapies/create',
                loadComponent: () =>
                    import(
                        './features/therapy/therapy-form/therapy-form'
                    ).then(component => component.TherapyForm),
                title: 'Add therapy | TakeCare'
            },
            {
                path: 'therapies/:id/edit',
                loadComponent: () =>
                    import(
                        './features/therapy/therapy-form/therapy-form'
                    ).then(component => component.TherapyForm),
                title: 'Edit therapy | TakeCare'
            },
            {
                path: 'therapies/:id',
                loadComponent: () =>
                    import('./features/therapy/therapy-details/therapy-details').then(component => component.TherapyDetails),
                title: 'Therapy details | TakeCare'
            },
            {
                path: 'professionals',
                component: ProfessionalContactList,
                title: 'Professionals | TakeCare'
            },
            {
                path: 'professionals/:id',
                component: ProfessionalContactDetails,
                title: 'Professional details | TakeCare'
            }   
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];