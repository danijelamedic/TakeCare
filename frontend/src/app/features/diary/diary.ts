import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { DiaryService } from '../../core/services/diary.service';
import { PatientService } from '../../core/services/patient.service';

import { DiaryEntryRequest, DiaryEntryResponse, DiaryEntryType, DiaryEntryVisibility } from '../../core/models/diary.models';

@Component({
    selector: 'app-diary',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './diary.html',
    styleUrl: './diary.scss'
})
export class Diary implements OnInit {

    diaryEntries: DiaryEntryResponse[] = [];
    filteredEntries: DiaryEntryResponse[] = [];

    diaryForm: FormGroup;

    readonly entryTypes = Object.values(DiaryEntryType);
    readonly visibilityOptions = Object.values(DiaryEntryVisibility);

    patientId: number | null = null;
    currentUserId: number | null = null;

    selectedType = 'ALL';
    selectedDate = '';

    isCoordinator = false;
    isFormOpen = false;
    isEditing = false;
    isLoading = true;
    isSaving = false;

    editingEntryId: number | null = null;

    pendingDeleteEntryId: number | null = null;
    deletingEntryId: number | null = null;

    readonly expandedEntryIds = new Set<number>();

    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly authService: AuthService,
        private readonly patientService: PatientService,
        private readonly diaryService: DiaryService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {
        this.diaryForm = this.formBuilder.group({
            title: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(150)
                ]
            ],
            content: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(5000)
                ]
            ],
            entryType: [
                DiaryEntryType.GENERAL,
                Validators.required
            ],
            entryDate: [
                this.getTodayDate(),
                Validators.required
            ],
            visibility: [
                DiaryEntryVisibility.PRIVATE_TO_PARENT,
                Validators.required
            ]
        });
    }

    ngOnInit(): void {
        this.initializeDiary();
    }

    private initializeDiary(): void {
        const currentUser = this.authService.getCurrentUser();

        if (!currentUser) {
            this.isLoading = false;
            this.errorMessage =
                'User information could not be loaded.';
            this.changeDetectorRef.detectChanges();
            return;
        }

        this.currentUserId = currentUser.id;

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
                this.loadDiaryEntries();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'Create a care profile before using the diary.';
                this.changeDetectorRef.detectChanges();
                this.refreshView();
            }
        });
    }

    private loadAssignedPatient(): void {
        this.patientService.getAssignedPatient().subscribe({
            next: patient => {
                this.patientId = patient.id;
                this.loadDiaryEntries();
            },
            error: () => {
                this.isLoading = false;
                this.errorMessage =
                    'No patient is currently assigned to you.';
                this.changeDetectorRef.detectChanges();
                this.refreshView();
            }
        });
    }

    loadDiaryEntries(): void {
        if (this.patientId === null) {
            this.isLoading = false;
            this.refreshView();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.refreshView();

        this.diaryService
            .getDiaryEntriesForPatient(this.patientId)
            .subscribe({
                next: entries => {
                    this.diaryEntries = [...entries].sort(
                        (first, second) =>
                            this.getEntryTimestamp(second) -
                            this.getEntryTimestamp(first)
                    );

                    this.applyFilter();
                    this.isLoading = false;
                    this.refreshView();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage =
                        'Diary entries could not be loaded.';
                    this.refreshView();
                }
            });
    }

    openCreateForm(): void {
        if (this.patientId === null) {
            return;
        }

        this.clearMessages();

        this.isEditing = false;
        this.editingEntryId = null;
        this.isFormOpen = true;

        this.diaryForm.reset({
            title: '',
            content: '',
            entryType: DiaryEntryType.GENERAL,
            entryDate: this.getTodayDate(),
            visibility: this.isCoordinator
                ? DiaryEntryVisibility.SHARED
                : DiaryEntryVisibility.PRIVATE_TO_PARENT
        });
    }

    openEditForm(entry: DiaryEntryResponse): void {
        if (!this.canModify(entry)) {
            return;
        }

        this.clearMessages();

        this.isEditing = true;
        this.editingEntryId = entry.id;
        this.isFormOpen = true;

        this.diaryForm.reset({
            title: entry.title,
            content: entry.content,
            entryType: entry.entryType,
            entryDate: entry.entryDate ?? this.getTodayDate(),
            visibility: this.isCoordinator
                ? DiaryEntryVisibility.SHARED
                : entry.visibility
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    closeForm(): void {
        this.isFormOpen = false;
        this.isEditing = false;
        this.editingEntryId = null;
        this.diaryForm.reset();
    }

    saveEntry(): void {
        this.clearMessages();

        if (
            this.diaryForm.invalid ||
            this.patientId === null
        ) {
            this.diaryForm.markAllAsTouched();
            return;
        }

        const formValue = this.diaryForm.getRawValue();

        const request: DiaryEntryRequest = {
            patientId: this.patientId,
            title: formValue.title.trim(),
            content: formValue.content.trim(),
            entryType: formValue.entryType,
            entryDate: new Date().toISOString().substring(0, 10),
            visibility: this.isCoordinator
                ? DiaryEntryVisibility.SHARED
                : formValue.visibility
        };

        this.isSaving = true;

        if (
            this.isEditing &&
            this.editingEntryId !== null
        ) {
            this.updateEntry(this.editingEntryId, request);
        } else {
            this.createEntry(request);
        }
    }

    private createEntry(request: DiaryEntryRequest): void {
        this.diaryService.createDiaryEntry(request).subscribe({
            next: () => {
                this.isSaving = false;
                this.closeForm();
                this.successMessage =
                    'Diary entry was added successfully.';
                this.loadDiaryEntries();
            },
            error: error => {
                this.isSaving = false;
                this.errorMessage =
                    error.error?.message ??
                    'Diary entry could not be added.';
            }
        });
    }

    private updateEntry(
        entryId: number,
        request: DiaryEntryRequest
    ): void {
        this.diaryService
            .updateDiaryEntry(entryId, request)
            .subscribe({
                next: () => {
                    this.isSaving = false;
                    this.closeForm();
                    this.successMessage =
                        'Diary entry was updated successfully.';
                    this.loadDiaryEntries();
                },
                error: error => {
                    this.isSaving = false;
                    this.errorMessage =
                        error.error?.message ??
                        'Diary entry could not be updated.';
                }
            });
    }

    requestDelete(entry: DiaryEntryResponse): void {
        if (!this.canModify(entry)) {
            return;
        }

        this.pendingDeleteEntryId = entry.id;
        this.clearMessages();
    }

    cancelDelete(): void {
        this.pendingDeleteEntryId = null;
    }

    confirmDelete(entry: DiaryEntryResponse): void {
        if (
            !this.canModify(entry) ||
            this.deletingEntryId !== null
        ) {
            return;
        }

        this.clearMessages();
        this.deletingEntryId = entry.id;

        this.diaryService.deleteDiaryEntry(entry.id).subscribe({
            next: () => {
                this.pendingDeleteEntryId = null;
                this.deletingEntryId = null;
                this.expandedEntryIds.delete(entry.id);

                this.successMessage =
                    'Diary entry was deleted successfully.';

                this.loadDiaryEntries();
            },
            error: error => {
                this.deletingEntryId = null;
                this.errorMessage =
                    error.error?.message ??
                    'Diary entry could not be deleted.';
                this.refreshView();
            }
        });
    }

    onTypeFilterChange(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedType = selectElement.value;
        this.applyFilter();
    }

    onDateFilterChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.selectedDate = inputElement.value;
        this.applyFilter();
    }

    clearDateFilter(): void {
        this.selectedDate = '';
        this.applyFilter();
    }

    clearAllFilters(): void {
        this.selectedType = 'ALL';
        this.selectedDate = '';
        this.applyFilter();
    }

    private applyFilter(): void {
        this.filteredEntries = this.diaryEntries.filter(entry => {
            const matchesType =
                this.selectedType === 'ALL' ||
                entry.entryType === this.selectedType;

            const entryDate = entry.createdAt
                ? entry.createdAt.substring(0, 10)
                : '';

            const matchesDate =
                !this.selectedDate ||
                entryDate === this.selectedDate;

            return matchesType && matchesDate;
        });
    }

    canModify(entry: DiaryEntryResponse): boolean {
        return entry.authorId === this.currentUserId;
    }

    getTypeLabel(type: DiaryEntryType): string {
        return type
            .toLowerCase()
            .split('_')
            .map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    }

    getVisibilityLabel(
        visibility: DiaryEntryVisibility
    ): string {
        return visibility === DiaryEntryVisibility.SHARED
            ? 'Shared'
            : 'Private';
    }

    getEntryIcon(type: DiaryEntryType): string {
        const icons: Record<DiaryEntryType, string> = {
            [DiaryEntryType.GENERAL]: '🗁',
            [DiaryEntryType.HEALTH]: '⚕',
            [DiaryEntryType.BEHAVIOR]: '⚛︎',
            [DiaryEntryType.MOOD]: '☺',
            [DiaryEntryType.SCHOOL]: '✎',
            [DiaryEntryType.THERAPY]: '𖹭',
            [DiaryEntryType.PROFESSIONAL_NOTE]: '🗒',
            [DiaryEntryType.COORDINATION_NOTE]: '❏',
            [DiaryEntryType.IMPORTANT_EVENT]: '★',
            [DiaryEntryType.OTHER]: '➤'
        };

        return icons[type] ?? '🗁';
    }

    getEntryClass(type: DiaryEntryType): string {
        return `entry-${type.toLowerCase().replaceAll('_', '-')}`;
    }

    trackEntry(
        index: number,
        entry: DiaryEntryResponse
    ): number {
        return entry.id;
    }

    private getEntryTimestamp(
        entry: DiaryEntryResponse
    ): number {
        const date = entry.entryDate ?? entry.createdAt;
        return new Date(date).getTime();
    }

    private getTodayDate(): string {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    get titleControl() {
        return this.diaryForm.get('title')!;
    }

    get contentControl() {
        return this.diaryForm.get('content')!;
    }

    get entryDateControl() {
        return this.diaryForm.get('entryDate')!;
    }

    private refreshView(): void {
        this.changeDetectorRef.detectChanges();
    }

    isEntryExpanded(entryId: number): boolean {
        return this.expandedEntryIds.has(entryId);
    }

    toggleEntryContent(entryId: number): void {
        if (this.expandedEntryIds.has(entryId)) {
            this.expandedEntryIds.delete(entryId);
        } else {
            this.expandedEntryIds.add(entryId);
        }
    }
}