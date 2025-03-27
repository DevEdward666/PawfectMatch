import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Report } from '../../../models/report.model';
import { Pet } from '../../../models/pet.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  currentUser: User | null = null;
  loading: boolean = true;
  stats = {
    totalUsers: 0,
    totalPets: 0,
    totalProducts: 0,
    pendingReports: 0,
    pendingAdoptions: 0,
    unreadMessages: 0
  };
  recentPets: Pet[] = [];
  recentReports: Report[] = [];
  
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
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;
    
    try {
      // For a real application, we would have a dedicated dashboard endpoint
      // that returns all this data in a single call to optimize performance.
      // Here we're making multiple calls for demonstration purposes.
      
      // Get user count
      this.apiService.get<any>('users').subscribe(
        response => {
          if (response.success) {
            this.stats.totalUsers = response.data.length;
          }
        }
      );
      
      // Get pet count and recent pets
      this.apiService.get<any>('pets').subscribe(
        response => {
          if (response.success) {
            this.stats.totalPets = response.data.length;
            this.recentPets = response.data.slice(0, 5);
            
            // Count pending adoptions
            this.stats.pendingAdoptions = response.data.filter((pet: Pet) => pet.status === 'pending').length;
          }
        }
      );
      
      // Get product count
      this.apiService.get<any>('products').subscribe(
        response => {
          if (response.success) {
            this.stats.totalProducts = response.data.length;
          }
        }
      );
      
      // Get reports
      this.apiService.get<any>('reports').subscribe(
        response => {
          if (response.success) {
            this.recentReports = response.data.slice(0, 5);
            this.stats.pendingReports = response.data.filter((report: Report) => report.status === 'pending').length;
          }
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
      this.toastService.error('Failed to load dashboard data');
    }
  }
  
  navigateTo(path: string) {
    this.router.navigate(['/admin/' + path]);
  }
  
  refreshData(event: any) {
    this.loadDashboardData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewing':
        return 'primary';
      case 'resolved':
        return 'success';
      case 'available':
        return 'success';
      case 'adopted':
        return 'medium';
      default:
        return 'medium';
    }
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
