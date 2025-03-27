import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  
  // Filter options
  selectedCategory: string = '';
  selectedSort: string = 'name_asc';
  
  // Available filter options
  categories: string[] = ['food', 'toys', 'accessories', 'grooming', 'other'];
  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_asc', label: 'Price (Low-High)' },
    { value: 'price_desc', label: 'Price (High-Low)' },
    { value: 'newest', label: 'Newest First' }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    
    try {
      // Determine sort parameter for API
      let sortParam = '';
      switch (this.selectedSort) {
        case 'price_asc':
          sortParam = 'price_asc';
          break;
        case 'price_desc':
          sortParam = 'price_desc';
          break;
        case 'newest':
          sortParam = 'newest';
          break;
        default:
          sortParam = '';
      }
      
      // Build query parameters
      const params: any = {};
      if (this.selectedCategory) {
        params.category = this.selectedCategory;
      }
      if (sortParam) {
        params.sort = sortParam;
      }
      if (this.searchTerm) {
        params.search = this.searchTerm;
      }
      
      this.apiService.get<any>('products', params).subscribe(
        response => {
          if (response.success) {
            this.products = response.data;
            this.filteredProducts = this.products;
          } else {
            this.toastService.error('Failed to load products');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching products:', error);
          this.toastService.error('Failed to load products');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading products:', error);
      this.loading = false;
    }
  }
  
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.loadProducts();
  }
  
  onCategoryChange(event: any) {
    this.selectedCategory = event.detail.value;
    this.loadProducts();
  }
  
  onSortChange(event: any) {
    this.selectedSort = event.detail.value;
    this.loadProducts();
  }
  
  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedSort = 'name_asc';
    this.loadProducts();
  }
  
  navigateToProductDetail(productId: number) {
    this.router.navigate(['/product-detail', productId]);
  }
  
  refreshProducts(event: any) {
    this.loadProducts();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
  
  // Helper to format price
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}
