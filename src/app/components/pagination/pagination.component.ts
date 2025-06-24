import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationService } from '../../services/pagination.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 6;
  @Input() startIndex: number = 1;
  @Input() endIndex: number = 6;
  @Input() hasNextPage: boolean = false;
  @Input() hasPreviousPage: boolean = false;
  @Input() showItemsPerPageSelector: boolean = false;
  @Input() maxVisiblePages: number = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  constructor(private paginationService: PaginationService) {}

  visiblePages = computed(() => {
    return this.paginationService.getPageNumbers(
      this.currentPage,
      this.totalPages,
      this.maxVisiblePages
    );
  });

  get showFirstPage(): boolean {
    const firstVisible = this.visiblePages()[0];
    return firstVisible > 1;
  }

  get showLastPage(): boolean {
    const lastVisible = this.visiblePages()[this.visiblePages().length - 1];
    return lastVisible < this.totalPages;
  }

  get showFirstSeparator(): boolean {
    const firstVisible = this.visiblePages()[0];
    return firstVisible > 2;
  }

  get showLastSeparator(): boolean {
    const lastVisible = this.visiblePages()[this.visiblePages().length - 1];
    return lastVisible < this.totalPages - 1;
  }

  onPageClick(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPreviousPage(): void {
    if (this.hasPreviousPage) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.hasNextPage) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newItemsPerPage = parseInt(target.value, 10);
    this.itemsPerPageChange.emit(newItemsPerPage);
  }
} 