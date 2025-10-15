import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HistoryService } from '../../services/history.service';
import { HistoryEntry } from '../../interfaces/interfaces';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.html'
})
export class HistoryComponent {
  private historyService = inject(HistoryService);

  // Carga inicial de datos
  error = signal<string | null>(null);
  private initialHistory = toSignal(
    this.historyService.getHistory().pipe(
      catchError(err => {
        console.error('Error al cargar historial:', err);
        this.error.set("No se pudo cargar el historial.");
        return of([]); // Devuelve un array vacío en caso de error
      })
    ),
    { initialValue: [] }
  );
  
  // Señal para la lista de historial, que podemos modificar si es necesario
  history = signal<HistoryEntry[]>([]);

  // Señales para la UI
  selectedHistoryItem = signal<HistoryEntry | null>(null);
  loading = computed(() => this.initialHistory() === undefined);
  searchTerm = signal('');
  visibleItemsCount = signal(5);

  // ✅ NUEVO: Señales para controlar el autocompletado en móviles
  isSearchFocused = signal(false);
  showAutocomplete = computed(() => {
    // Muestra el autocompletado solo si el input está enfocado y hay texto
    return this.isSearchFocused() && this.searchTerm().length > 0;
  });

  // Señales computadas para filtrar y paginar (sin cambios)
  filteredHistory = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const historyList = this.history();
    if (!term) return historyList;
    return historyList.filter(item => item.query.toLowerCase().includes(term));
  });

  visibleHistory = computed(() => {
    return this.filteredHistory().slice(0, this.visibleItemsCount());
  });

  constructor() {
    // Efecto para inicializar y seleccionar el primer item
    effect(() => {
      const initialData = this.initialHistory();
      if(initialData.length > 0) {
        this.history.set(initialData);
        // Selecciona el primer item solo si no hay uno ya seleccionado
        if (!this.selectedHistoryItem()) {
          this.selectedHistoryItem.set(initialData[0]);
        }
      }
    });

    // Efecto para auto-seleccionar al filtrar en escritorio
    effect(() => {
      const currentFilteredHistory = this.filteredHistory();
      // No cambia la selección si ya hay algo seleccionado que coincide con el filtro
      const currentSelection = this.selectedHistoryItem();
      if(currentSelection && currentFilteredHistory.some(item => item.id === currentSelection.id)) {
        return;
      }
      this.selectedHistoryItem.set(currentFilteredHistory[0] ?? null);
    });
  }

  showHistoryDetails(item: HistoryEntry): void {
    this.selectedHistoryItem.set(item);
  }

  showMore(): void {
    this.visibleItemsCount.update(count => count + 5);
  }

  // ✅ NUEVO: Métodos para manejar el foco del buscador
  onSearchFocus(): void {
    this.isSearchFocused.set(true);
  }

  onSearchBlur(): void {
    // Pequeño delay para permitir que el clic en una sugerencia se registre antes de ocultar
    setTimeout(() => this.isSearchFocused.set(false), 200);
  }

  // ✅ NUEVO: Método para seleccionar desde el autocompletado
  selectFromAutocomplete(item: HistoryEntry): void {
    this.searchTerm.set(item.query); // Rellena el input
    this.showHistoryDetails(item); // Selecciona el item para mostrar sus resultados
    this.isSearchFocused.set(false); // Oculta el autocompletado
  }
}
