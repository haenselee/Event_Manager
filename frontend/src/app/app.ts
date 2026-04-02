import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth';
import { AuthUser } from './auth-user';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get currentUser(): AuthUser | null {
    return this.auth.currentUser;
  }

  get isTeacher(): boolean {
    return this.auth.isTeacher;
  }

  get isStudent(): boolean {
    return this.auth.isStudent;
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }
}
