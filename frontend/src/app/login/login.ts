import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loading = false;
          this.errorMessage = '';
          this.password = '';
          this.cdr.detectChanges();
          this.router.navigate(['/events']);
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Login-Fehler', err);
          this.loading = false;
          this.errorMessage = 'Login fehlgeschlagen. Prüfe Benutzername/Passwort.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}
