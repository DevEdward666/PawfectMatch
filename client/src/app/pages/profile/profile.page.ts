import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { AdoptionApplication } from '../../models/pet.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  segment: string = 'info';
  applications: AdoptionApplication[] = [];
  loading: boolean = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      address: ['']
    });
    
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone || '',
          address: user.address || ''
        });
      }
    });
  }
  
  ionViewWillEnter() {
    this.loadAdoptionApplications();
  }

  segmentChanged(event: any) {
    this.segment = event.detail.value;
    
    if (this.segment === 'adoptions') {
      this.loadAdoptionApplications();
    }
  }
  
  async loadAdoptionApplications() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('pets/applications/user').subscribe(
        response => {
          if (response.success) {
            this.applications = response.data;
          } else {
            this.toastService.error('Failed to load adoption applications');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching adoption applications:', error);
          this.toastService.error('Failed to load adoption applications');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading adoption applications:', error);
      this.loading = false;
    }
  }
  
  async updateProfile() {
    if (this.profileForm.invalid) return;
    
    await this.loadingService.show('Updating profile...');
    
    const profileData = {
      name: this.profileForm.value.name,
      phone: this.profileForm.value.phone || undefined,
      address: this.profileForm.value.address || undefined
    };
    
    this.apiService.put<any>('users/profile', profileData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Profile updated successfully');
          
          // Update local user state
          if (this.currentUser && response.data) {
            const updatedUser = {
              ...this.currentUser,
              ...response.data
            };
            this.authService.updateUserState(updatedUser);
          }
        } else {
          this.toastService.error(response.message || 'Failed to update profile');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to update profile');
      }
    );
  }
  
  async changePassword() {
    if (this.passwordForm.invalid) return;
    
    await this.loadingService.show('Changing password...');
    
    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };
    
    this.apiService.put<any>('users/change-password', passwordData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Password changed successfully');
          this.passwordForm.reset();
        } else {
          this.toastService.error(response.message || 'Failed to change password');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to change password');
      }
    );
  }
  
  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: async () => {
            await this.loadingService.show('Logging out...');
            
            setTimeout(async () => {
              await this.loadingService.hide();
              await this.authService.logout();
              this.router.navigate(['/login']);
            }, 1000);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  }
  
  navigateToPetDetail(petId: number) {
    this.router.navigate(['/pet-detail', petId]);
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
  
  goToAdmin() {
    this.router.navigate(['/admin']);
  }
}
