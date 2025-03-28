import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      return true;
    }

    // If logged in but not admin
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/tabs/home']);
      this.toastService.present({
        message: 'You do not have permission to access this page.',
        duration: 3000,
        color: 'danger'
      });
      return false;
    }

    // Not logged in so redirect to login page
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    this.toastService.present({
      message: 'Please log in to access this page',
      duration: 3000,
      color: 'warning'
    });
    return false;
  }
}