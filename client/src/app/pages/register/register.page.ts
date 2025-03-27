import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService
  ) { 
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      address: ['']
    });
  }

  ngOnInit() {
    // Check if already logged in
    this.authService.isAuthenticated().then(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigateByUrl('/tabs/home');
      }
    });
  }

  async register() {
    if (this.registerForm.invalid) {
      return;
    }
    
    await this.loadingService.show('Creating your account...');
    
    const userData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phone: this.registerForm.value.phone || undefined,
      address: this.registerForm.value.address || undefined
    };
    
    this.authService.register(userData).subscribe(
      async (response) => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Registration successful!');
          this.router.navigateByUrl('/tabs/home');
        } else {
          this.toastService.error(response.message || 'Registration failed.');
        }
      },
      async (error) => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Registration failed. Please try again.');
      }
    );
  }
  
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
