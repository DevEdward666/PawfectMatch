import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Pet } from '../../models/pet.model';
import { Product } from '../../models/product.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  currentUser: User | null = null;
  featuredPets: Pet[] = [];
  featuredProducts: Product[] = [];
  loading: boolean = true;
  
  constructor(
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    
    try {
      // Get featured pets (limit to 5 available pets)
      this.apiService.get<any>('pets', { status: 'available' }).subscribe(
        response => {
          if (response.success) {
            this.featuredPets = response.data.slice(0, 5);
          }
        },
        error => {
          console.error('Error fetching pets:', error);
        }
      );
      
      // Get featured products (limit to 5)
      this.apiService.get<any>('products').subscribe(
        response => {
          if (response.success) {
            this.featuredProducts = response.data.slice(0, 5);
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching products:', error);
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading home data:', error);
      this.loading = false;
    }
  }
  
  navigateToPets() {
    this.router.navigate(['/tabs/pets']);
  }
  
  navigateToProducts() {
    this.router.navigate(['/tabs/products']);
  }
  
  navigateToPetDetail(petId: number) {
    this.router.navigate(['/pet-detail', petId]);
  }
  
  navigateToProductDetail(productId: number) {
    this.router.navigate(['/product-detail', productId]);
  }
  
  navigateToReport() {
    this.router.navigate(['/tabs/report']);
  }
  
  refreshData(event: any) {
    this.loadData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
