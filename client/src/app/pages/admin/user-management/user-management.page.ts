import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading.service';
import { ToastService } from '../../../services/toast.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.page.html',
  styleUrls: ['./user-management.page.scss'],
})
export class UserManagementPage implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  
  // Form for adding/editing users
  userForm: FormGroup;
  passwordForm: FormGroup;
  isEditMode: boolean = false;
  currentUserId: number | null = null;
  
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: ['user', Validators.required],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      address: ['']
    });
    
    this.passwordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    
    try {
      this.apiService.get<any>('users').subscribe(
        response => {
          if (response.success) {
            this.users = response.data;
          } else {
            this.toastService.error('Failed to load users');
          }
          this.loading = false;
        },
        error => {
          console.error('Error fetching users:', error);
          this.toastService.error('Failed to load users');
          this.loading = false;
        }
      );
    } catch (error) {
      console.error('Error loading users:', error);
      this.loading = false;
    }
  }
  
  async openUserForm(user?: User) {
    if (user) {
      // Edit mode - don't require password for updates
      this.isEditMode = true;
      this.currentUserId = user.id;
      
      this.userForm.setControl('password', this.formBuilder.control('', []));
      
      this.userForm.patchValue({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        phone: user.phone || '',
        address: user.address || ''
      });
    } else {
      // Add mode - require password for new users
      this.isEditMode = false;
      this.currentUserId = null;
      
      this.userForm.setControl('password', this.formBuilder.control('', [
        Validators.required,
        Validators.minLength(6)
      ]));
      
      this.userForm.reset({
        role: 'user'
      });
    }
    
    const alert = await this.alertController.create({
      header: this.isEditMode ? 'Edit User' : 'Add New User',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Full Name',
          value: this.userForm.value.name
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email Address',
          value: this.userForm.value.email
        },
        {
          name: 'password',
          type: 'password',
          placeholder: this.isEditMode ? 'Password (leave blank to keep current)' : 'Password',
          value: this.userForm.value.password
        },
        {
          name: 'role',
          type: 'text',
          placeholder: 'Role (admin or user)',
          value: this.userForm.value.role
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Phone (optional)',
          value: this.userForm.value.phone
        },
        {
          name: 'address',
          type: 'textarea',
          placeholder: 'Address (optional)',
          value: this.userForm.value.address
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: this.isEditMode ? 'Update' : 'Add',
          handler: (data) => {
            this.userForm.patchValue({
              name: data.name,
              email: data.email,
              password: data.password,
              role: data.role,
              phone: data.phone,
              address: data.address
            });
            
            if (this.userForm.valid) {
              if (this.isEditMode) {
                this.updateUser();
              } else {
                this.addUser();
              }
            } else {
              this.toastService.error('Please complete all required fields');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async addUser() {
    if (this.userForm.invalid) return;
    
    await this.loadingService.show('Adding user...');
    
    const userData = {
      name: this.userForm.value.name,
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      role: this.userForm.value.role,
      phone: this.userForm.value.phone || undefined,
      address: this.userForm.value.address || undefined
    };
    
    this.apiService.post<any>('users', userData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('User added successfully');
          this.userForm.reset();
          this.loadUsers();
        } else {
          this.toastService.error(response.message || 'Failed to add user');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to add user');
      }
    );
  }
  
  async updateUser() {
    if (this.userForm.invalid || !this.currentUserId) return;
    
    await this.loadingService.show('Updating user...');
    
    const userData = {
      name: this.userForm.value.name,
      email: this.userForm.value.email,
      role: this.userForm.value.role,
      phone: this.userForm.value.phone || undefined,
      address: this.userForm.value.address || undefined
    };
    
    // Add password only if provided
    if (this.userForm.value.password) {
      userData['password'] = this.userForm.value.password;
    }
    
    this.apiService.put<any>(`users/${this.currentUserId}`, userData).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('User updated successfully');
          this.userForm.reset();
          this.currentUserId = null;
          this.loadUsers();
        } else {
          this.toastService.error(response.message || 'Failed to update user');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to update user');
      }
    );
  }
  
  async openResetPasswordForm(user: User) {
    const alert = await this.alertController.create({
      header: `Reset Password for ${user.name}`,
      inputs: [
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'New Password',
          min: 6
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset Password',
          handler: (data) => {
            if (!data.newPassword || data.newPassword.length < 6) {
              this.toastService.error('Password must be at least 6 characters');
              return false;
            }
            this.resetUserPassword(user.id, data.newPassword);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async resetUserPassword(userId: number, newPassword: string) {
    await this.loadingService.show('Resetting password...');
    
    this.apiService.put<any>(`users/${userId}/reset-password`, { newPassword }).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Password reset successfully');
        } else {
          this.toastService.error(response.message || 'Failed to reset password');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to reset password');
      }
    );
  }
  
  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${user.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.confirmDeleteUser(user.id);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async confirmDeleteUser(userId: number) {
    await this.loadingService.show('Deleting user...');
    
    this.apiService.delete<any>(`users/${userId}`).subscribe(
      async response => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('User deleted successfully');
          this.loadUsers();
        } else {
          this.toastService.error(response.message || 'Failed to delete user');
        }
      },
      async error => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Failed to delete user');
      }
    );
  }
  
  onSearch(event: any) {
    this.searchTerm = event.detail.value;
  }
  
  filterUsers(): User[] {
    if (!this.searchTerm) {
      return this.users;
    }
    
    const searchTerm = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  }
  
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  refreshData(event: any) {
    this.loadUsers();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
