import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { CoordinatorResponse } from '../../core/models/coordinator.models';
import { CoordinatorService } from '../../core/services/coordinator.service';

@Component({
    selector: 'app-support-coordinator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './support-coordinator.html',
    styleUrl: './support-coordinator.scss'
})
export class SupportCoordinator implements OnInit {
  coordinators: CoordinatorResponse[] = [];
  
  selectedCoordinatorId: number | null = null;

  isSubmitting = false;
  successMessage = '';

    isLoading = true;
    errorMessage = '';

    constructor(
        private readonly coordinatorService: CoordinatorService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadCoordinators();
    }

    loadCoordinators(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.coordinatorService
            .getAvailable()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                })
            )
            .subscribe({
                next: coordinators => {
                    this.coordinators = coordinators;
                },
                error: (error: HttpErrorResponse) => {
                    console.error(
                        'Available coordinators request failed:',
                        error
                    );

                    if (error.status === 401) {
                        this.errorMessage =
                            'Your session has expired. Please sign in again.';
                        return;
                    }

                    if (error.status === 403) {
                        this.errorMessage =
                            'You do not have permission to view support coordinators.';
                        return;
                    }

                    this.errorMessage =
                        'Support coordinators could not be loaded.';
                }
            });
    }
  sendRequest(): void {
      if (this.selectedCoordinatorId === null) {
          this.errorMessage =
              'Please select a support coordinator.';
          return;
      }

      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.coordinatorService
          .sendRequest({
              coordinatorId: this.selectedCoordinatorId
          })
          .pipe(
              finalize(() => {
                  this.isSubmitting = false;
                  this.changeDetectorRef.detectChanges();
              })
          )
          .subscribe({
              next: () => {
                  this.successMessage =
                      'Connection request sent successfully.';

                  this.selectedCoordinatorId = null;

                  this.loadCoordinators();
              },
              error: (error: HttpErrorResponse) => {
                  console.error(
                      'Coordinator connection request failed:',
                      error
                  );

                  if (error.status === 401) {
                      this.errorMessage =
                          'Your session has expired. Please sign in again.';
                      return;
                  }

                  if (error.status === 403) {
                      this.errorMessage =
                          'You do not have permission to send this request.';
                      return;
                  }

                  this.errorMessage =
                      error.error?.message ??
                      'The connection request could not be sent.';
              }
          });
  }
}