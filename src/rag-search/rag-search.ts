import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService } from '../services/rag.service';
import { RagResponse } from './rag.model';

@Component({
  selector: 'app-rag-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rag-search.html',
  styleUrls: ['./rag-search.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RagSearchComponent {
  query = '';
  response: RagResponse | null = null;
  selectedFile: File | null = null;
  uploadMessage: string | null = null;
  loading = false;
  error: string | null = null;
  expandedSources = new Set<number>();

  constructor(
    private ragService: RagService,
    private cdr: ChangeDetectorRef
  ) {}

  ask(): void {
    if (!this.query.trim() || this.loading) return;

    this.loading = true;
    this.error = null;
    this.response = null;
    this.expandedSources.clear();

    this.ragService.ask(this.query.trim()).subscribe({
      next: (res) => {
        this.response = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Failed to get a response. Is the backend running?';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleSource(index: number): void {
    if (this.expandedSources.has(index)) {
      this.expandedSources.delete(index);
    } else {
      this.expandedSources.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedSources.has(index);
  }

  formatScore(score: number): string {
    return (score * 100).toFixed(1) + '%';
  }

  formatLatency(ms: number): string {
    return ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : ms + 'ms';
  }

  shortTitle(title: string): string {
    return title.replace(/^Rag test_/, '').replace(/\.pdf$/, '');
  }

  onFileSelected(event: Event): void {
    this.uploadMessage = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== 'application/pdf') {
      this.selectedFile = null;
      this.error = 'Only PDF files are supported. Please select a PDF.';
      this.cdr.markForCheck();
      return;
    }

    this.selectedFile = file;
    this.error = null;
    this.cdr.markForCheck();
  }

  uploadPdf(): void {
    if (!this.selectedFile || this.loading) {
      return;
    }

    const fileName = this.selectedFile.name;
    this.loading = true;
    this.error = null;
    this.uploadMessage = null;

    this.ragService.uploadPdf(this.selectedFile).subscribe({
      next: () => {
        this.uploadMessage = `${fileName} uploaded successfully.`;
        this.selectedFile = null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to upload PDF. Is the backend running?';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }
}