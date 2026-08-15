import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DocumentResponse, DocumentUploadData, UpdateDocumentRequest } from '../models/document.models';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {

    private readonly http = inject(HttpClient);

    private readonly apiUrl =
        `${environment.apiUrl}/documents`;

    uploadDocument(
        data: DocumentUploadData
    ): Observable<DocumentResponse> {

        const formData = new FormData();

        formData.append(
            'patientId',
            data.patientId.toString()
        );

        formData.append(
            'title',
            data.title
        );

        formData.append(
            'documentType',
            data.documentType
        );

        if (data.description?.trim()) {
            formData.append(
                'description',
                data.description.trim()
            );
        }

        if (data.documentDate) {
            formData.append(
                'documentDate',
                data.documentDate
            );
        }

        if (data.issuedById !== undefined) {
            formData.append(
                'issuedById',
                data.issuedById.toString()
            );
        }

        if (data.visibility) {
            formData.append(
                'visibility',
                data.visibility
            );
        }

        formData.append(
            'file',
            data.file,
            data.file.name
        );

        return this.http.post<DocumentResponse>(
            this.apiUrl,
            formData
        );
    }

    getPatientDocuments(
        patientId: number
    ): Observable<DocumentResponse[]> {

        return this.http.get<DocumentResponse[]>(
            `${this.apiUrl}/patient/${patientId}`
        );
    }

    getDocumentById(
        documentId: number
    ): Observable<DocumentResponse> {

        return this.http.get<DocumentResponse>(
            `${this.apiUrl}/${documentId}`
        );
    }

    updateDocument(
        documentId: number,
        request: UpdateDocumentRequest
    ): Observable<DocumentResponse> {

        return this.http.put<DocumentResponse>(
            `${this.apiUrl}/${documentId}`,
            request
        );
    }

    viewDocument(
        documentId: number
    ): Observable<Blob> {

        return this.http.get(
            `${this.apiUrl}/${documentId}/content`,
            {
                responseType: 'blob'
            }
        );
    }

    downloadDocument(
        documentId: number
    ): Observable<HttpResponse<Blob>> {

        return this.http.get(
            `${this.apiUrl}/${documentId}/download`,
            {
                responseType: 'blob',
                observe: 'response'
            }
        );
    }

    deleteDocument(
        documentId: number
    ): Observable<void> {

        return this.http.delete<void>(
            `${this.apiUrl}/${documentId}`
        );
    }

    getProfessionalDocuments(
        patientId: number,
        professionalId: number
    ): Observable<DocumentResponse[]> {

        return this.http.get<DocumentResponse[]>(
            `${this.apiUrl}/patient/${patientId}/professional/${professionalId}`
        );
    }
}