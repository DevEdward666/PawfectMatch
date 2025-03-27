import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async presentToast(message: string, color: string = 'primary', duration: number = 2000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }

  async success(message: string, duration: number = 2000): Promise<void> {
    await this.presentToast(message, 'success', duration);
  }

  async error(message: string, duration: number = 3000): Promise<void> {
    await this.presentToast(message, 'danger', duration);
  }

  async info(message: string, duration: number = 2000): Promise<void> {
    await this.presentToast(message, 'primary', duration);
  }

  async warning(message: string, duration: number = 2500): Promise<void> {
    await this.presentToast(message, 'warning', duration);
  }
}
