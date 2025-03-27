import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  returnUrl: string = '/tabs/home';
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authService: AuthService
  ) { 
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Get return url from route parameters or default to '/tabs/home'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tabs/home';
    
    // Check if already logged in
    this.authService.isAuthenticated().then(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      return;
    }
    
    await this.loadingService.show('Logging in...');
    
    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };
    
    this.authService.login(credentials).subscribe(
      async (response) => {
        await this.loadingService.hide();
        
        if (response.success) {
          this.toastService.success('Login successful!');
          // Navigate to admin or user dashboard based on role
          if (response.data?.user.role === 'admin') {
            this.router.navigateByUrl('/admin');
          } else {
            this.router.navigateByUrl(this.returnUrl);
          }
        } else {
          this.toastService.error(response.message || 'Login failed.');
        }
      },
      async (error) => {
        await this.loadingService.hide();
        this.toastService.error(error.error?.message || 'Login failed. Please try again.');
      }
    );
  }
  
  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
