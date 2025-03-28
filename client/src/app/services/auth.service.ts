import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  User, 
  LoginForm, 
  RegisterForm, 
  AuthResponse, 
  ChangePasswordForm, 
  UserProfile 
} from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private apiUrl = `${environment.apiUrl}/users`;
  private token: string | null = null;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const userData = this.storageService.getItem('currentUser');
    const storedToken = this.storageService.getItem('token');
    
    if (userData && storedToken) {
      this.currentUserSubject.next(JSON.parse(userData));
      this.token = storedToken;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'admin';
  }

  login(credentials: LoginForm): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.storeUserData(response);
      })
    );
  }

  register(userData: RegisterForm): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        this.storeUserData(response);
      })
    );
  }

  logout(): Observable<any> {
    this.token = null;
    this.currentUserSubject.next(null);
    this.storageService.removeItem('currentUser');
    this.storageService.removeItem('token');
    return of(true);
  }

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateProfile(profileData: UserProfile): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profileData).pipe(
      tap(updatedUser => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const mergedUser = { ...currentUser, ...updatedUser };
          this.currentUserSubject.next(mergedUser);
          this.storageService.setItem('currentUser', JSON.stringify(mergedUser));
        }
      })
    );
  }

  changePassword(passwordData: ChangePasswordForm): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData);
  }

  private storeUserData(authResponse: AuthResponse): void {
    this.token = authResponse.token;
    this.currentUserSubject.next(authResponse.user);
    this.storageService.setItem('currentUser', JSON.stringify(authResponse.user));
    this.storageService.setItem('token', authResponse.token);
  }
}