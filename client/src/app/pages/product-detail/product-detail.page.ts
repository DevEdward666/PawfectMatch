import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
})
export class ProductDetailPage implements OnInit {
  productId: number = 0;
  product: Product | null = null;
  loading: boolean = true;
  similarProducts: Product[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.productId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    
    if (this.productId) {
      this.loadProductDetails();
    } else {
      this.toastService.error('Invalid product ID');
      this.router.navigate(['/tabs/products']);
    }
  }

  async loadProductDetails() {
    this.loading = true;
    
    try {
      this.apiService.get<any>(`products/${this.productId}`).subscribe(
        response => {
          if (response.success) {
            this.product = response.data;
            this.loadSimilarProducts();
          } else {
            this.toastService.error('Failed to load product details');
            this.loading = false;
          }
        },
        error => {
          console.error('Error fetching product details:', error);
          this.toastService.error('Failed to load product details');
          this.loading = false;
          this.router.navigate(['/tabs/products']);
        }
      );
    } catch (error) {
      console.error('Error loading product details:', error);
      this.loading = false;
    }
  }
  
  loadSimilarProducts() {
    if (!this.product) return;
    
    // Get products in the same category
    this.apiService.get<any>('products', { 
      category: this.product.category 
    }).subscribe(
      response => {
        if (response.success) {
          // Filter out the current product and limit to 4 similar products
          this.similarProducts = response.data
            .filter((p: Product) => p.id !== this.productId)
            .slice(0, 4);
        }
        this.loading = false;
      },
      error => {
        console.error('Error fetching similar products:', error);
        this.loading = false;
      }
    );
  }
  
  async showProductUnavailable() {
    const toast = await this.toastController.create({
      message: 'This product is currently out of stock.',
      duration: 2000,
      color: 'warning',
      position: 'bottom'
    });
    
    await toast.present();
  }
  
  inquireAboutProduct() {
    // Navigate to messaging with a pre-filled message about this product
    this.router.navigate(['/tabs/messages'], { 
      queryParams: { 
        subject: `Inquiry about product: ${this.product?.name}`, 
        productId: this.productId 
      } 
    });
  }
  
  navigateToProductDetail(productId: number) {
    // Reload the page with the new product ID
    this.router.navigate(['/product-detail', productId], { replaceUrl: true });
    
    // Reload product details
    this.productId = productId;
    this.loadProductDetails();
  }
  
  goBack() {
    this.router.navigate(['/tabs/products']);
  }
  
  // Helper to format price
  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}
