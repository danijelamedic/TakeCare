import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { DocumentService } from '../../../core/services/document.service';
import { ProfessionalContactService } from '../../../core/services/professional-contact.service';

import { DocumentType, DocumentUploadData, DocumentVisibility, UpdateDocumentRequest } from '../../../core/models/document.models';
import { ProfessionalContactResponse, ProfessionalType } from '../../../core/models/professional-contact.models';

@Component({
    selector: 'app-document-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './document-form.html',
    styleUrl: './document-form.scss'
})
export class DocumentForm implements OnInit {

    patientId: number | null = null;
    documentId: number | null = null;

    isCoordinator = false;
    isEditMode = false;
    isLoading = true;
    isSubmitting = false;

    selectedFile: File | null = null;
    existingFileName = '';
    fileErrorMessage = '';
    errorMessage = '';
    
    professionals: ProfessionalContactResponse[] = [];

    isLoadingProfessionals = false;
    professionalsErrorMessage = '';

    readonly maximumFileSize =
        10 * 1024 * 1024;

    readonly maximumDocumentDate =
        new Date().toISOString().split('T')[0];

    readonly documentTypes: {
        label: string;
        value: DocumentType;
    }[] = [
        {
            label: 'Medical report',
            value: 'MEDICAL_REPORT'
        },
        {
            label: 'Prescription',
            value: 'PRESCRIPTION'
        },
        {
            label: 'Lab result',
            value: 'LAB_RESULT'
        },
        {
            label: 'Therapy plan',
            value: 'THERAPY_PLAN'
        },
        {
            label: 'Assessment',
            value: 'ASSESSMENT'
        },
        {
            label: 'Vaccination record',
            value: 'VACCINATION_RECORD'
        },
        {
            label: 'School document',
            value: 'SCHOOL_DOCUMENT'
        },
        {
            label: 'Social service document',
            value: 'SOCIAL_SERVICE_DOCUMENT'
        },
        {
            label: 'Referral',
            value: 'REFERRAL'
        },
        {
            label: 'Insurance document',
            value: 'INSURANCE_DOCUMENT'
        },
        {
            label: 'Other',
            value: 'OTHER'
        }
    ];

    private readonly formBuilder = inject(FormBuilder);
    readonly form = this.formBuilder.nonNullable.group({
        title: [
            '',
            [
                Validators.required,
                Validators.maxLength(200)
            ]
        ],
        documentType:
            this.formBuilder.nonNullable.control<DocumentType>(
                'MEDICAL_REPORT',
                {
                    validators: [
                        Validators.required
                    ]
                }
            ),
        description: [
            '',
            [
                Validators.maxLength(2000)
            ]
        ],
      documentDate: [''],
        issuedById: this.formBuilder.control<number | null>(null),
        visibility:
            this.formBuilder.nonNullable
                .control<DocumentVisibility>('SHARED')
    });

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly documentService: DocumentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly professionalContactService: ProfessionalContactService
    ) {}

    ngOnInit(): void {

        const documentIdParameter =
            this.route.snapshot.paramMap.get('id');

        if (documentIdParameter) {
            const parsedDocumentId =
                Number(documentIdParameter);

            if (
                Number.isNaN(parsedDocumentId) ||
                parsedDocumentId <= 0
            ) {
                this.errorMessage =
                    'The selected document is invalid.';
                this.isLoading = false;
                return;
            }

            this.documentId = parsedDocumentId;
            this.isEditMode = true;
        }

        this.initializeForm();
    }

    private initializeForm(): void {

        const currentUser =
            this.authService.getCurrentUser();

        if (!currentUser) {
            this.isLoading = false;
            this.errorMessage =
                'User information could not be loaded.';
            this.refreshView();
            return;
        }

        const role =
            currentUser.role?.toUpperCase() ?? '';

        this.isCoordinator =
            role.includes('COORDINATOR');

        if (this.isCoordinator) {
            this.form.controls.visibility.setValue(
                'SHARED'
            );

            this.loadAssignedPatient();
        } else {
            this.loadCurrentUserPatient();
        }
    }

    private loadCurrentUserPatient(): void {

        this.patientService
            .getCurrentUserPatient()
            .subscribe({
                next: patient => {
                  this.patientId = patient.id;
                  this.loadProfessionals();
                  this.loadDocumentIfEditing();
              },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'Create a care profile before uploading documents.';
                    this.refreshView();
                }
            });
    }

    private loadAssignedPatient(): void {

        this.patientService
            .getAssignedPatient()
            .subscribe({
                next: patient => {
                  this.patientId = patient.id;
                  this.loadProfessionals();
                  this.loadDocumentIfEditing();
              },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'No patient is currently assigned to you.';
                    this.refreshView();
                }
            });
    }

    private loadDocumentIfEditing(): void {

        if (
            !this.isEditMode ||
            this.documentId === null
        ) {
            this.isLoading = false;
            this.refreshView();
            return;
        }

        this.documentService
            .getDocumentById(this.documentId)
            .subscribe({
                next: document => {

                    const uploadedByCurrentRole =
                        this.isCoordinator
                            ? document.uploadedByRole ===
                                'SUPPORT_COORDINATOR'
                            : document.uploadedByRole ===
                                'PARENT';

                    if (!uploadedByCurrentRole) {
                        this.errorMessage =
                            'You can only edit documents that you uploaded.';
                        this.isLoading = false;
                        this.refreshView();
                        return;
                    }
                
                    this.existingFileName =
                      document.originalFileName;

                    this.form.patchValue({
                        title: document.title,
                        documentType:
                            document.documentType,
                        description:
                            document.description ?? '',
                        documentDate:
                            document.documentDate ?? '',
                        issuedById: document.issuedById,
                        visibility:
                            this.isCoordinator
                                ? 'SHARED'
                                : document.visibility
                    });

                    this.isLoading = false;
                    this.refreshView();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'The document could not be loaded.';
                    this.refreshView();
                }
            });
    }

    onFileSelected(event: Event): void {

        const input =
            event.target as HTMLInputElement;

        const file =
            input.files?.[0] ?? null;

        this.selectedFile = null;
        this.fileErrorMessage = '';

        if (!file) {
            return;
        }

        if (file.size > this.maximumFileSize) {
            this.fileErrorMessage =
                'The selected file must not exceed 10 MB.';
            input.value = '';
            return;
        }

        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ];

        if (!allowedTypes.includes(file.type)) {
            this.fileErrorMessage =
                'Only PDF, JPEG and PNG files are allowed.';
            input.value = '';
            return;
        }

        this.selectedFile = file;
    }

    removeSelectedFile(
        fileInput: HTMLInputElement
    ): void {

        this.selectedFile = null;
        this.fileErrorMessage = '';
        fileInput.value = '';
    }

    submit(): void {

        this.clearMessages();

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (
            !this.isEditMode &&
            this.selectedFile === null
        ) {
            this.fileErrorMessage =
                'Please select a document.';
            return;
        }

        if (this.patientId === null) {
            this.errorMessage =
                'Patient information is unavailable.';
            return;
        }

        this.isSubmitting = true;

        if (this.isEditMode) {
            this.updateDocument();
        } else {
            this.uploadDocument();
        }
    }

    private uploadDocument(): void {

        if (
            this.selectedFile === null ||
            this.patientId === null
        ) {
            this.isSubmitting = false;
            return;
        }

        const formValue =
            this.form.getRawValue();

        const request: DocumentUploadData = {
            patientId: this.patientId,
            title: formValue.title.trim(),
            documentType:
                formValue.documentType,
            description:
                formValue.description.trim(),
            documentDate:
              formValue.documentDate || undefined,
            issuedById: formValue.issuedById ?? undefined,
            visibility:
                this.isCoordinator
                    ? 'SHARED'
                    : formValue.visibility,
            file: this.selectedFile
        };

        this.documentService
            .uploadDocument(request)
            .subscribe({
                next: () => {
                    this.navigateToDocuments();
                },
                error: error => {
                    this.isSubmitting = false;
                    this.errorMessage =
                        this.getErrorMessage(
                            error,
                            'The document could not be uploaded.'
                        );
                    this.refreshView();
                }
            });
    }

    private updateDocument(): void {

        if (this.documentId === null) {
            this.isSubmitting = false;
            return;
        }

        const formValue =
            this.form.getRawValue();

        const request: UpdateDocumentRequest = {
            title: formValue.title.trim(),
            documentType:
                formValue.documentType,
            description:
                formValue.description.trim() || null,
            documentDate:
                formValue.documentDate || null,
            issuedById: formValue.issuedById || null,
            visibility:
                this.isCoordinator
                    ? 'SHARED'
                    : formValue.visibility
        };

        this.documentService
            .updateDocument(
                this.documentId,
                request
            )
            .subscribe({
                next: () => {
                    this.navigateToDocuments();
                },
                error: error => {
                    this.isSubmitting = false;
                    this.errorMessage =
                        this.getErrorMessage(
                            error,
                            'The document could not be updated.'
                        );
                    this.refreshView();
                }
            });
    }

    cancel(): void {
        this.navigateToDocuments();
    }

    get titleControl() {
        return this.form.controls.title;
    }

    get descriptionControl() {
        return this.form.controls.description;
    }

    private navigateToDocuments(): void {

        const routePrefix =
            this.isCoordinator
                ? '/coordinator'
                : '/parent';

        this.router.navigate([
            routePrefix,
            'documents'
        ]);
    }

    private getErrorMessage(
        error: unknown,
        fallbackMessage: string
    ): string {

        if (
            error instanceof HttpErrorResponse &&
            typeof error.error?.message === 'string'
        ) {
            return error.error.message;
        }

        return fallbackMessage;
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.fileErrorMessage = '';
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
  
    private loadProfessionals(): void {

        if (this.patientId === null) {
            return;
        }

        this.isLoadingProfessionals = true;
        this.professionalsErrorMessage = '';

        this.professionalContactService
            .getProfessionalsForPatient(this.patientId)
            .subscribe({
                next: professionals => {
                    this.professionals =
                        [...professionals].sort(
                            (first, second) =>
                                first.lastName.localeCompare(
                                    second.lastName
                                ) ||
                                first.firstName.localeCompare(
                                    second.firstName
                                )
                        );

                    this.isLoadingProfessionals = false;
                    this.refreshView();
                },
                error: () => {
                    this.professionals = [];
                    this.isLoadingProfessionals = false;
                    this.professionalsErrorMessage =
                        'Connected professionals could not be loaded.';
                    this.refreshView();
                }
            });
    }
  
    getProfessionalTypeLabel(
          professionalType: ProfessionalType
      ): string {

          return professionalType
              .toLowerCase()
              .split('_')
              .map(word =>
                  word.charAt(0).toUpperCase() +
                  word.slice(1)
              )
              .join(' ');
    }
}