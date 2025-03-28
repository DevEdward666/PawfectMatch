import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage: Storage = window.localStorage;

  constructor() { }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}