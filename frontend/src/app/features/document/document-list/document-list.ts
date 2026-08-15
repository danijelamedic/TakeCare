import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { DocumentService } from '../../../core/services/document.service';

import { DocumentResponse, DocumentType } from '../../../core/models/document.models';

type DocumentFilter = 'ALL' | DocumentType;

@Component({
    selector: 'app-document-list',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './document-list.html',
    styleUrl: './document-list.scss'
})
export class DocumentList implements OnInit {

    documents: DocumentResponse[] = [];

    patientId: number | null = null;

    selectedFilter: DocumentFilter = 'ALL';

    isCoordinator = false;
    isLoading = true;

    viewingDocumentId: number | null = null;
    downloadingDocumentId: number | null = null;
    deletingDocumentId: number | null = null;
    pendingDeleteDocumentId: number | null = null;

    errorMessage = '';
    successMessage = '';

    readonly filters: {
        label: string;
        value: DocumentFilter;
    }[] = [
        {
            label: 'All documents',
            value: 'ALL'
        },
        {
            label: 'Medical reports',
            value: 'MEDICAL_REPORT'
        },
        {
            label: 'Therapy plans',
            value: 'THERAPY_PLAN'
        },
        {
            label: 'Assessments',
            value: 'ASSESSMENT'
        },
        {
            label: 'Lab results',
            value: 'LAB_RESULT'
        },
        {
            label: 'Referrals',
            value: 'REFERRAL'
        },
        {
            label: 'School documents',
            value: 'SCHOOL_DOCUMENT'
        },
        {
            label: 'Other',
            value: 'OTHER'
        }
    ];

    constructor(
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly documentService: DocumentService,
        private readonly router: Router,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.initializeDocuments();
    }

    get filteredDocuments(): DocumentResponse[] {

        if (this.selectedFilter === 'ALL') {
            return this.documents;
        }

        return this.documents.filter(
            document =>
                document.documentType ===
                this.selectedFilter
        );
    }

    private initializeDocuments(): void {

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
                    this.loadDocuments();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'Create a care profile before viewing documents.';
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
                    this.loadDocuments();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'No patient is currently assigned to you.';
                    this.refreshView();
                }
            });
    }

    loadDocuments(): void {

        if (this.patientId === null) {
            this.isLoading = false;
            this.refreshView();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.documentService
            .getPatientDocuments(this.patientId)
            .subscribe({
                next: documents => {
                    this.documents = documents;
                    this.isLoading = false;
                    this.refreshView();
                },
                error: () => {
                    this.documents = [];
                    this.isLoading = false;
                    this.errorMessage =
                        'Documents could not be loaded.';
                    this.refreshView();
                }
            });
    }

    selectFilter(event: Event): void {

        const select =
            event.target as HTMLSelectElement;

        this.selectedFilter =
            select.value as DocumentFilter;

        this.pendingDeleteDocumentId = null;
        this.clearMessages();
    }

    openUploadForm(): void {

        if (this.patientId === null) {
            return;
        }

        this.router.navigate([
            this.getRoutePrefix(),
            'documents',
            'upload'
        ]);
    }

    openEditForm(document: DocumentResponse): void {

        if (!this.canManageDocument(document)) {
            return;
        }

        this.router.navigate([
            this.getRoutePrefix(),
            'documents',
            document.id,
            'edit'
        ]);
    }

    viewDocument(document: DocumentResponse): void {

        if (this.viewingDocumentId !== null) {
            return;
        }

        this.clearMessages();
        this.viewingDocumentId = document.id;

        const previewWindow = window.open(
            '',
            '_blank'
        );

        this.documentService
            .viewDocument(document.id)
            .subscribe({
                next: file => {
                    const fileUrl =
                        URL.createObjectURL(file);

                    if (previewWindow) {
                        previewWindow.location.href =
                            fileUrl;
                    } else {
                        window.open(fileUrl, '_blank');
                    }

                    window.setTimeout(
                        () => URL.revokeObjectURL(fileUrl),
                        60_000
                    );

                    this.viewingDocumentId = null;
                    this.refreshView();
                },
                error: () => {
                    previewWindow?.close();

                    this.viewingDocumentId = null;
                    this.errorMessage =
                        'The document could not be opened.';
                    this.refreshView();
                }
            });
    }

    downloadDocument(document: DocumentResponse): void {

        if (this.downloadingDocumentId !== null) {
            return;
        }

        this.clearMessages();
        this.downloadingDocumentId = document.id;

        this.documentService
            .downloadDocument(document.id)
            .subscribe({
                next: response => {
                    const file = response.body;

                    if (!file) {
                        this.downloadingDocumentId = null;
                        this.errorMessage =
                            'The downloaded file is empty.';
                        this.refreshView();
                        return;
                    }

                    const fileUrl =
                        URL.createObjectURL(file);

                    const downloadLink =
                        window.document.createElement('a');

                    downloadLink.href = fileUrl;
                    downloadLink.download =
                        document.originalFileName;

                    downloadLink.click();

                    URL.revokeObjectURL(fileUrl);

                    this.downloadingDocumentId = null;
                    this.successMessage =
                        'The document has been downloaded.';
                    this.refreshView();
                },
                error: () => {
                    this.downloadingDocumentId = null;
                    this.errorMessage =
                        'The document could not be downloaded.';
                    this.refreshView();
                }
            });
    }

    requestDelete(document: DocumentResponse): void {

        if (!this.canManageDocument(document)) {
            return;
        }

        this.clearMessages();
        this.pendingDeleteDocumentId =
            document.id;
    }

    cancelDelete(): void {
        this.pendingDeleteDocumentId = null;
    }

    confirmDelete(document: DocumentResponse): void {

        if (
            !this.canManageDocument(document) ||
            this.deletingDocumentId !== null
        ) {
            return;
        }

        this.clearMessages();
        this.deletingDocumentId = document.id;

        this.documentService
            .deleteDocument(document.id)
            .subscribe({
                next: () => {
                    this.documents =
                        this.documents.filter(
                            currentDocument =>
                                currentDocument.id !==
                                document.id
                        );

                    this.deletingDocumentId = null;
                    this.pendingDeleteDocumentId = null;
                    this.successMessage =
                        'The document has been deleted.';
                    this.refreshView();
                },
                error: () => {
                    this.deletingDocumentId = null;
                    this.errorMessage =
                        'The document could not be deleted.';
                    this.refreshView();
                }
            });
    }

    canManageDocument(
        document: DocumentResponse
    ): boolean {

        if (this.isCoordinator) {
            return document.uploadedByRole ===
                'SUPPORT_COORDINATOR';
        }

        return document.uploadedByRole === 'PARENT';
    }

    getDocumentTypeLabel(
        documentType: DocumentType
    ): string {

        const labels: Record<DocumentType, string> = {
            MEDICAL_REPORT: 'Medical report',
            PRESCRIPTION: 'Prescription',
            LAB_RESULT: 'Lab result',
            THERAPY_PLAN: 'Therapy plan',
            ASSESSMENT: 'Assessment',
            VACCINATION_RECORD: 'Vaccination record',
            SCHOOL_DOCUMENT: 'School document',
            SOCIAL_SERVICE_DOCUMENT:
                'Social service document',
            REFERRAL: 'Referral',
            INSURANCE_DOCUMENT:
                'Insurance document',
            OTHER: 'Other'
        };

        return labels[documentType];
    }

    getFileTypeLabel(
        document: DocumentResponse
    ): string {

        if (document.contentType === 'application/pdf') {
            return 'PDF';
        }

        if (document.contentType === 'image/png') {
            return 'PNG';
        }

        if (document.contentType === 'image/jpeg') {
            return 'JPEG';
        }

        return 'File';
    }

    formatFileSize(bytes: number): string {

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        const kilobytes = bytes / 1024;

        if (kilobytes < 1024) {
            return `${kilobytes.toFixed(1)} KB`;
        }

        const megabytes = kilobytes / 1024;

        return `${megabytes.toFixed(1)} MB`;
    }

    trackDocumentById(
        index: number,
        document: DocumentResponse
    ): number {
        return document.id;
    }

    private getRoutePrefix(): string {

        return this.isCoordinator
            ? '/coordinator'
            : '/parent';
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }
}