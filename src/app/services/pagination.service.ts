import { Injectable, signal, computed } from '@angular/core';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  
  /**
   * Crea un estado de paginación reactivo
   */
  createPaginationState<T>(itemsPerPage: number = 6) {
    const currentPage = signal(1);
    const items = signal<T[]>([]);
    const itemsPerPageSignal = signal(itemsPerPage);

    const totalItems = computed(() => items().length);
    const totalPages = computed(() => Math.ceil(totalItems() / itemsPerPageSignal()));
    
    const paginatedData = computed((): PaginatedData<T> => {
      const currentPageValue = currentPage();
      const totalPagesValue = totalPages();
      const totalItemsValue = totalItems();
      const itemsPerPageValue = itemsPerPageSignal();
      
      const startIndex = (currentPageValue - 1) * itemsPerPageValue;
      const endIndex = Math.min(startIndex + itemsPerPageValue, totalItemsValue);
      const paginatedItems = items().slice(startIndex, endIndex);

      return {
        items: paginatedItems,
        pagination: {
          currentPage: currentPageValue,
          totalPages: totalPagesValue,
          totalItems: totalItemsValue,
          itemsPerPage: itemsPerPageValue,
          hasNextPage: currentPageValue < totalPagesValue,
          hasPreviousPage: currentPageValue > 1,
          startIndex: startIndex + 1,
          endIndex: endIndex
        }
      };
    });

    const goToPage = (page: number) => {
      const totalPagesValue = totalPages();
      if (page >= 1 && page <= totalPagesValue) {
        currentPage.set(page);
      }
    };

    const nextPage = () => {
      const current = currentPage();
      const total = totalPages();
      if (current < total) {
        currentPage.set(current + 1);
      }
    };

    const previousPage = () => {
      const current = currentPage();
      if (current > 1) {
        currentPage.set(current - 1);
      }
    };

    const setItems = (newItems: T[]) => {
      items.set(newItems);
      // Reset to first page when items change
      currentPage.set(1);
    };

    const reset = () => {
      currentPage.set(1);
      items.set([]);
    };

    return {
      // Signals
      paginatedData,
      currentPage: () => currentPage(),
      totalPages: () => totalPages(),
      totalItems: () => totalItems(),
      
      // Actions
      goToPage,
      nextPage,
      previousPage,
      setItems,
      reset
    };
  }

  /**
   * Genera un array de números de página para mostrar en la paginación
   */
  getPageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
} 