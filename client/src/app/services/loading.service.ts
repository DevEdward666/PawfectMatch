import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;

  constructor(private loadingController: LoadingController) {}

  async show(message: string = 'Please wait...'): Promise<void> {
    if (this.loading) {
      await this.hide();
    }
    
    this.loading = await this.loadingController.create({
      message,
      spinner: 'circles',
      backdropDismiss: false
    });
    
    await this.loading.present();
  }

  async hide(): Promise<void> {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }

  async showWithAutoHide(message: string, duration: number = 2000): Promise<void> {
    await this.show(message);
    
    setTimeout(async () => {
      await this.hide();
    }, duration);
  }
}
