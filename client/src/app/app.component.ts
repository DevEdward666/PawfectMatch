import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.checkAuthState();
  }

  async initializeApp() {
    await this.platform.ready();
    
    if (this.platform.is('capacitor')) {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await SplashScreen.hide();
      } catch (error) {
        console.error('Error initializing native functionality', error);
      }
    }
  }

  async checkAuthState() {
    const isAuthenticated = await this.authService.isAuthenticated();
    if (!isAuthenticated) {
      this.router.navigate(['/login']);
    }
  }
}
