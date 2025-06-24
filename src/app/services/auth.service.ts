import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signals para el estado de autenticación
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private apiService: ApiService) {
    if (this.isBrowser) {
      this.loadUserFromStorage();
    }
  }

  login(credentials: LoginRequest): Observable<User | null> {
    return this.apiService.getUserByEmail(credentials.email).pipe(
      map(user => {
        if (user && this.validatePassword(credentials.password, user)) {
          this.setCurrentUser(user);
          return user;
        }
        throw new Error('Credenciales inválidas');
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.apiService.getUserByEmail(userData.email).pipe(
      switchMap(existingUser => {
        if (existingUser) {
          throw new Error('El email ya está registrado');
        }
        return this.apiService.createUser(userData);
      }),
      map(newUser => {
        this.setCurrentUser(newUser);
        return newUser;
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('memorama_user');
      localStorage.removeItem('memorama_auth_token');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  private setCurrentUser(user: User): void {
    const userToStore = { ...user };
    delete userToStore.password;
    delete userToStore.password_confirmation;
    
    if (this.isBrowser) {
      localStorage.setItem('memorama_user', JSON.stringify(userToStore));
      localStorage.setItem('memorama_auth_token', 'authenticated');
    }
    
    this.currentUserSubject.next(userToStore);
    this.isAuthenticated.set(true);
    this.currentUser.set(userToStore);
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }
    
    const storedUser = localStorage.getItem('memorama_user');
    const authToken = localStorage.getItem('memorama_auth_token');
    
    if (storedUser && authToken) {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
      this.isAuthenticated.set(true);
      this.currentUser.set(user);
    }
  }

  private validatePassword(inputPassword: string, user: User): boolean {
    return inputPassword.length >= 6;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getUserByEmail(email: string): Observable<User | null> {
    return this.apiService.getUserByEmail(email);
  }
} 