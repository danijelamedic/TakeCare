import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ProfessionalContactResponse, ProfessionalType } from '../../../core/models/professional-contact.models';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { ProfessionalContactService } from '../../../core/services/professional-contact.service';

type ProfessionalTypeFilter = 'ALL' | ProfessionalType;

@Component({
    selector: 'app-professional-contact-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './professional-contact-list.html',
    styleUrl: './professional-contact-list.scss'
})
export class ProfessionalContactList implements OnInit {

      connectedProfessionals: ProfessionalContactResponse[] = [];
      catalogueProfessionals: ProfessionalContactResponse[] = [];

      patientId: number | null = null;

      isCoordinator = false;
      isLoading = true;
      isCatalogueLoading = false;
      isCatalogueOpen = false;

      searchTerm = '';
      selectedType: ProfessionalTypeFilter = 'ALL';

      catalogueSearchTerm = '';
      catalogueSelectedType: ProfessionalTypeFilter = 'ALL';

      connectingContactId: number | null = null;
      removingContactId: number | null = null;
      pendingRemovalContact: ProfessionalContactResponse | null = null;

      errorMessage = '';
      successMessage = '';
      catalogueErrorMessage = '';

      readonly professionalTypes: {
          label: string;
          value: ProfessionalTypeFilter;
      }[] = [
          {
              label: 'All professions',
              value: 'ALL'
          },
          {
              label: 'Pediatrician',
              value: 'PEDIATRICIAN'
          },
          {
              label: 'General practitioner',
              value: 'GENERAL_PRACTITIONER'
          },
          {
              label: 'Neurologist',
              value: 'NEUROLOGIST'
          },
          {
              label: 'Psychiatrist',
              value: 'PSYCHIATRIST'
          },
          {
              label: 'Psychologist',
              value: 'PSYCHOLOGIST'
          },
          {
              label: 'Speech therapist',
              value: 'SPEECH_THERAPIST'
          },
          {
              label: 'Physiotherapist',
              value: 'PHYSIOTHERAPIST'
          },
          {
              label: 'Occupational therapist',
              value: 'OCCUPATIONAL_THERAPIST'
          },
          {
              label: 'Special education teacher',
              value: 'SPECIAL_EDUCATION_TEACHER'
          },
          {
              label: 'Social worker',
              value: 'SOCIAL_WORKER'
          },
          {
              label: 'Other',
              value: 'OTHER'
          }
      ];

      constructor(
          private readonly authService: AuthService,
          private readonly patientService: PatientService,
          private readonly professionalContactService:
              ProfessionalContactService,
          private readonly router: Router,
          private readonly changeDetectorRef: ChangeDetectorRef
      ) {}

      ngOnInit(): void {
          this.initializePage();
      }

      get filteredConnectedProfessionals():
          ProfessionalContactResponse[] {
          return this.filterProfessionals(
              this.connectedProfessionals,
              this.searchTerm,
              this.selectedType
          );
      }

      get filteredCatalogueProfessionals():
          ProfessionalContactResponse[] {
          return this.filterProfessionals(
              this.catalogueProfessionals,
              this.catalogueSearchTerm,
              this.catalogueSelectedType
          );
      }

      get availableCatalogueProfessionals():
          ProfessionalContactResponse[] {
          const connectedIds = new Set(
              this.connectedProfessionals.map(
                  professional => professional.id
              )
          );

          return this.filteredCatalogueProfessionals.filter(
              professional => !connectedIds.has(professional.id)
          );
      }

      private initializePage(): void {
          const currentUser = this.authService.getCurrentUser();

          if (!currentUser) {
              this.isLoading = false;
              this.errorMessage =
                  'User information could not be loaded.';
              this.refreshView();
              return;
          }

          const role = currentUser.role?.toUpperCase() ?? '';

          this.isCoordinator = role.includes('COORDINATOR');

          if (this.isCoordinator) {
              this.loadAssignedPatient();
          } else {
              this.loadCurrentUserPatient();
          }
      }

      private loadCurrentUserPatient(): void {
          this.patientService.getCurrentUserPatient().subscribe({
              next: patient => {
                  this.patientId = patient.id;
                  this.loadConnectedProfessionals();
              },
              error: () => {
                  this.isLoading = false;
                  this.errorMessage =
                      'Create a care profile before viewing professionals.';
                  this.refreshView();
              }
          });
      }

      private loadAssignedPatient(): void {
          this.patientService.getAssignedPatient().subscribe({
              next: patient => {
                  this.patientId = patient.id;
                  this.loadConnectedProfessionals();
              },
              error: () => {
                  this.isLoading = false;
                  this.errorMessage =
                      'No patient is currently assigned to you.';
                  this.refreshView();
              }
          });
      }

      loadConnectedProfessionals(): void {
          if (this.patientId === null) {
              this.isLoading = false;
              this.refreshView();
              return;
          }

          this.isLoading = true;
          this.errorMessage = '';

          this.professionalContactService
              .getProfessionalsForPatient(this.patientId)
              .subscribe({
                  next: professionals => {
                      this.connectedProfessionals =
                          this.sortProfessionals(professionals);

                      this.isLoading = false;
                      this.refreshView();
                  },
                  error: () => {
                      this.connectedProfessionals = [];
                      this.isLoading = false;
                      this.errorMessage =
                          'Professional contacts could not be loaded.';
                      this.refreshView();
                  }
              });
      }

      openCatalogue(): void {
          if (!this.isCoordinator || this.patientId === null) {
              return;
          }

          this.clearMessages();
          this.isCatalogueOpen = true;

          if (this.catalogueProfessionals.length === 0) {
              this.loadCatalogue();
          }
      }

      closeCatalogue(): void {
          if (this.connectingContactId !== null) {
              return;
          }

          this.isCatalogueOpen = false;
          this.catalogueSearchTerm = '';
          this.catalogueSelectedType = 'ALL';
          this.catalogueErrorMessage = '';
      }

      private loadCatalogue(): void {
          this.isCatalogueLoading = true;
          this.catalogueErrorMessage = '';

          this.professionalContactService
              .getAllProfessionals()
              .subscribe({
                  next: professionals => {
                      this.catalogueProfessionals =
                          this.sortProfessionals(professionals);

                      this.isCatalogueLoading = false;
                      this.refreshView();
                  },
                  error: () => {
                      this.catalogueProfessionals = [];
                      this.isCatalogueLoading = false;
                      this.catalogueErrorMessage =
                          'The professional catalogue could not be loaded.';
                      this.refreshView();
                  }
              });
      }

      connectProfessional(
          professional: ProfessionalContactResponse
      ): void {
          if (
              this.patientId === null ||
              this.connectingContactId !== null
          ) {
              return;
          }

          this.clearMessages();
          this.catalogueErrorMessage = '';
          this.connectingContactId = professional.id;

          this.professionalContactService
              .connectProfessionalToPatient(
                  professional.id,
                  this.patientId
              )
              .subscribe({
                  next: connectedProfessional => {
                      this.connectedProfessionals =
                          this.sortProfessionals([
                              ...this.connectedProfessionals,
                              connectedProfessional
                          ]);

                      this.connectingContactId = null;
                      this.successMessage =
                          `${connectedProfessional.fullName} was connected to the patient.`;

                      this.refreshView();
                  },
                  error: error => {
                      this.connectingContactId = null;
                      this.catalogueErrorMessage =
                          error?.error?.message ||
                          'The professional could not be connected.';

                      this.refreshView();
                  }
              });
      }

      requestRemoval(
          professional: ProfessionalContactResponse
      ): void {
          if (!this.isCoordinator) {
              return;
          }

          this.pendingRemovalContact = professional;
      }

      cancelRemoval(): void {
          if (this.removingContactId !== null) {
              return;
          }

          this.pendingRemovalContact = null;
      }

      confirmRemoval(): void {
          if (
              this.patientId === null ||
              this.pendingRemovalContact === null ||
              this.removingContactId !== null
          ) {
              return;
          }

          const professional = this.pendingRemovalContact;

          this.clearMessages();
          this.removingContactId = professional.id;

          this.professionalContactService
              .disconnectProfessionalFromPatient(
                  professional.id,
                  this.patientId
              )
              .subscribe({
                  next: () => {
                      this.connectedProfessionals =
                          this.connectedProfessionals.filter(
                              currentProfessional =>
                                  currentProfessional.id !== professional.id
                          );

                      this.removingContactId = null;
                      this.pendingRemovalContact = null;
                      this.successMessage =
                          `${professional.fullName} was removed from the patient.`;

                      this.refreshView();
                  },
                  error: error => {
                      this.removingContactId = null;
                      this.errorMessage =
                          error?.error?.message ||
                          'The professional could not be removed.';

                      this.refreshView();
                  }
              });
      }

      openProfessionalDetails(contactId: number): void {
          const routePrefix = this.isCoordinator
              ? '/coordinator'
              : '/parent';

          this.router.navigate([
              routePrefix,
              'professionals',
              contactId
          ]);
      }

      clearMainFilters(): void {
          this.searchTerm = '';
          this.selectedType = 'ALL';
      }

      clearCatalogueFilters(): void {
          this.catalogueSearchTerm = '';
          this.catalogueSelectedType = 'ALL';
      }

      getProfessionalTypeLabel(
          type: ProfessionalType
      ): string {
          return this.professionalTypes.find(
              option => option.value === type
          )?.label ?? type;
      }

      trackProfessionalById(
          index: number,
          professional: ProfessionalContactResponse
      ): number {
          return professional.id;
      }

      private filterProfessionals(
          professionals: ProfessionalContactResponse[],
          searchTerm: string,
          selectedType: ProfessionalTypeFilter
      ): ProfessionalContactResponse[] {
          const normalizedSearch = searchTerm
              .trim()
              .toLowerCase();

          return professionals.filter(professional => {
              const matchesType =
                  selectedType === 'ALL' ||
                  professional.professionalType === selectedType;

              const searchableText = [
                  professional.fullName,
                  professional.specialization,
                  professional.institutionName,
                  professional.email,
                  professional.phoneNumber
              ]
                  .filter(value => Boolean(value))
                  .join(' ')
                  .toLowerCase();

              const matchesSearch =
                  normalizedSearch.length === 0 ||
                  searchableText.includes(normalizedSearch);

              return matchesType && matchesSearch;
          });
      }

      private sortProfessionals(
          professionals: ProfessionalContactResponse[]
      ): ProfessionalContactResponse[] {
          return [...professionals].sort(
              (first, second) =>
                  first.lastName.localeCompare(second.lastName) ||
                  first.firstName.localeCompare(second.firstName)
          );
      }

      private clearMessages(): void {
          this.errorMessage = '';
          this.successMessage = '';
      }

      private refreshView(): void {
          this.changeDetectorRef.detectChanges();
      }
  
    getProfessionalClass(type: ProfessionalType): string {
      switch (type) {
          case 'PEDIATRICIAN':
          case 'GENERAL_PRACTITIONER':
          case 'NEUROLOGIST':
              return 'professional-medical';

          case 'PSYCHIATRIST':
          case 'PSYCHOLOGIST':
              return 'professional-mental-health';

          case 'SPEECH_THERAPIST':
          case 'PHYSIOTHERAPIST':
          case 'OCCUPATIONAL_THERAPIST':
          case 'SPECIAL_EDUCATION_TEACHER':
              return 'professional-therapy';

          case 'SOCIAL_WORKER':
          case 'OTHER':
          default:
              return 'professional-support';
      }
  }
}