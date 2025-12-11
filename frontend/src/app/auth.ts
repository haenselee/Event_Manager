import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthUser, Role } from './auth-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginUrl = 'http://localhost:8080/api/auth/login';
  private registerUrl = 'http://localhost:8080/api/auth/register';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  login(username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(this.loginUrl, { username, password }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  register(username: string, password: string, role: Role): Observable<AuthUser> {
    return this.http.post<AuthUser>(this.registerUrl, { username, password, role });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === 'TEACHER';
  }

  get isStudent(): boolean {
    return this.currentUser?.role === 'STUDENT';
  }
}
