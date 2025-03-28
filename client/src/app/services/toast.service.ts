import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/react';

interface ToastOptions {
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async present(options: ToastOptions): Promise<void> {
    const toast = await this.toastController.create({
      message: options.message,
      duration: options.duration || 2000,
      position: options.position || 'bottom',
      color: options.color || 'dark'
    });
    await toast.present();
  }

  async success(message: string, duration: number = 2000): Promise<void> {
    await this.present({
      message,
      duration,
      color: 'success'
    });
  }

  async error(message: string, duration: number = 3000): Promise<void> {
    await this.present({
      message,
      duration,
      color: 'danger'
    });
  }

  async warning(message: string, duration: number = 2500): Promise<void> {
    await this.present({
      message,
      duration,
      color: 'warning'
    });
  }

  async info(message: string, duration: number = 2000): Promise<void> {
    await this.present({
      message,
      duration,
      color: 'primary'
    });
  }
}