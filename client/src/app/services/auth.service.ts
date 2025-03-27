import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, UserLogin, UserRegister, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.loadUserFromStorage();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async loadUserFromStorage(): Promise<void> {
    try {
      const { value: userJson } = await Storage.get({ key: this.userKey });
      if (userJson) {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }

  register(user: UserRegister): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('users/register', user).pipe(
      tap(async (response) => {
        if (response.success && response.data) {
          await this.storeUserAndToken(response.data.user, response.data.token);
        }
      })
    );
  }

  login(credentials: UserLogin): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('users/login', credentials).pipe(
      tap(async (response) => {
        if (response.success && response.data) {
          await this.storeUserAndToken(response.data.user, response.data.token);
        }
      })
    );
  }

  async storeUserAndToken(user: User, token: string): Promise<void> {
    this.currentUserSubject.next(user);
    await Storage.set({ key: this.tokenKey, value: token });
    await Storage.set({ key: this.userKey, value: JSON.stringify(user) });
  }

  async getToken(): Promise<string | null> {
    const { value } = await Storage.get({ key: this.tokenKey });
    return value;
  }

  async logout(): Promise<void> {
    await Storage.remove({ key: this.tokenKey });
    await Storage.remove({ key: this.userKey });
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): Observable<boolean> {
    return this.getToken().then(token => {
      return of(!!token);
    }).catch(() => {
      return of(false);
    });
  }

  isAdmin(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user?.role === 'admin')
    );
  }

  updateUserState(user: User): void {
    this.currentUserSubject.next(user);
    Storage.set({ key: this.userKey, value: JSON.stringify(user) });
  }
}
