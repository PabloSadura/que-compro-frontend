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
  templateUrl: './history.html',
})
export class HistoryComponent {
  private historyService = inject(HistoryService);

  // Señales para la UI del componente
  error = signal<string | null>(null);
  selectedHistoryItem = signal<HistoryEntry | null>(null);
  searchTerm = signal('');
  visibleItemsCount = signal(5);

  // --- CORRECCIÓN APLICADA ---
  // 1. La señal que recibe los datos ahora es privada. Puede ser 'undefined' mientras carga.
  private historyData = toSignal(
    this.historyService.getHistory().pipe(
      catchError(err => {
        console.error('Error al cargar historial:', err);
        this.error.set("No se pudo cargar el historial.");
        return of([]); // En caso de error, devolvemos un array vacío.
      })
    ),
    { initialValue: undefined } 
  );

  // 2. 'loading' se computa a partir de la señal privada.
  loading = computed(() => this.historyData() === undefined);

  // 3. Creamos una señal pública 'history' que SIEMPRE es un array.
  //    Si los datos aún no han llegado, será un array vacío.
  history = computed(() => this.historyData() ?? []);

  // Las señales computadas ahora consumen la señal 'history', que es segura.
  filteredHistory = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const historyList = this.history(); // Ya no se necesita '|| []'
    if (!term) return historyList;
    return historyList.filter(item => item.query.toLowerCase().includes(term));
  });

  visibleHistory = computed(() => {
    return this.filteredHistory().slice(0, this.visibleItemsCount());
  });

  constructor() {
    // El 'effect' ahora reacciona a los cambios en 'filteredHistory' de forma segura.
    effect(() => {
      const currentFilteredHistory = this.filteredHistory();
      this.selectedHistoryItem.set(currentFilteredHistory[0] ?? null);
    });
  }

  // Los métodos de interacción no cambian
  showHistoryDetails(item: HistoryEntry): void {
    this.selectedHistoryItem.set(item);
  }

  showMore(): void {
    this.visibleItemsCount.update(count => count + 5);
  }
  
  // Lógica para el autocompletado en móvil (se mantiene)
  isSearchFocused = signal(false);
  showAutocomplete = computed(() => this.isSearchFocused() && this.searchTerm().length > 0);

  onSearchFocus(): void { this.isSearchFocused.set(true); }
  onSearchBlur(): void { setTimeout(() => this.isSearchFocused.set(false), 200); }
  selectFromAutocomplete(item: HistoryEntry): void {
    this.searchTerm.set(item.query);
    this.showHistoryDetails(item);
    this.isSearchFocused.set(false);
  }
}

