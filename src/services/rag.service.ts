import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RagResponse } from '../rag-search/rag.model';

@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly API = 'http://localhost:8081/rag';

  constructor(private http: HttpClient) {}

  ask(query: string): Observable<RagResponse> {
    return this.http.post<RagResponse>(`${this.API}/ask`, { query });
  }

  uploadPdf(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<void>(`${this.API}/upload`, formData);
  }
}