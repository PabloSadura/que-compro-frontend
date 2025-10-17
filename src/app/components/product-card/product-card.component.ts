import { Component, Input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {  Product } from '../../interfaces/interfaces';
import { ProductService } from '../../services/product.service';

type ModalSection = 'features' | 'pros' | 'cons';

@Component({
  selector: 'app-product-cards',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
})
export class ProductCardsComponent {
  private productService = inject(ProductService);

  @Input() products: Product[] | undefined | null = [];
  @Input() collectionId: string | undefined | null = '';
  @Input() recommendation: string | undefined | null = '';
  @Input() loading: boolean = false;
  @Input() status: string = '';

  private parsePrice(priceString: string | undefined | null): number {
    if (!priceString) return 0;
    const numericString = priceString.replace(/[$.ARS\s]/g, '');
    return parseFloat(numericString) || 0;
  }

  // Señal computada que ordena y marca los productos
  processedProducts = computed(() => {
    const prods = this.products;

    if (!prods || prods.length === 0) {
      return [];
    }

    // 1. Ordenamos la lista de productos de mayor a menor precio
    return prods.sort((a, b) => {
      const priceA = this.parsePrice(a.price);
      const priceB = this.parsePrice(b.price);
      return priceB - priceA; // Orden descendente
    });
  });

  // El resto de la lógica del modal se mantiene igual
  isModalOpen = signal(false);
  selectedProductForModal = signal<Product | null>(null);
  isModalLoading = signal(false);
  currentImageIndex = signal(0);
  openSection = signal<ModalSection | null>('features');

  openQuickViewModal(product: Product): void {
    this.isModalOpen.set(true);
    this.isModalLoading.set(true);
    this.selectedProductForModal.set(product);
    this.currentImageIndex.set(0);
    this.openSection.set('features');
    
    const collectionId = this.collectionId;
    
    if (!collectionId) {
      console.error("Error: No se proporcionó un ID de colección al componente.");
      this.isModalLoading.set(false);
      return;
    }

    this.productService.getProductById(collectionId, product.product_id?.toString()|| '').subscribe({
      next: (fullProduct) => {
        this.selectedProductForModal.set(fullProduct);
        this.isModalLoading.set(false);
      },
      error: (err) => {
        console.error("Error al buscar los detalles del producto:", err);
        this.isModalLoading.set(false);
      }
    });
  }

    closeModal(): void { this.isModalOpen.set(false); }

    nextImage(thumbnails: string[] | undefined) {
      if (!thumbnails || thumbnails.length === 0) return;
      this.currentImageIndex.update(index => (index + 1) % thumbnails.length);

    }

    prevImage(thumbnails: string[] | undefined) {
      if (!thumbnails || thumbnails.length === 0) return;
      this.currentImageIndex.update(index => (index - 1 + thumbnails.length) % thumbnails.length);
    }

    toggleSection(sectionId: ModalSection): void {
      this.openSection.update(current => current === sectionId ? null : sectionId);
    }  
}

