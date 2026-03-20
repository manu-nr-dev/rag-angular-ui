import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService } from '../services/rag.service';
import { RagResponse, RagSource } from './rag.model';

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

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }
}