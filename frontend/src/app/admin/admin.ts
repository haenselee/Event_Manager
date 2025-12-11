import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface AdminUser {
  id: number;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  username = '';
  password = '';
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT';

  users: AdminUser[] = [];

  error = '';
  success = '';

  private usersApi = 'http://localhost:8080/api/users';
  private registerApi = 'http://localhost:8080/api/auth/register';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<AdminUser[]>(this.usersApi).subscribe({
      next: (list) => {
        this.users = list;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Benutzer', err);
        this.error = 'Benutzerliste konnte nicht geladen werden.';
      }
    });
  }

  createUser(): void {
    this.error = '';
    this.success = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Bitte Benutzername und Passwort angeben.';
      return;
    }

    const body = {
      username: this.username.trim(),
      password: this.password,
      role: this.role
    };

    this.http.post<AdminUser>(this.registerApi, body).subscribe({
      next: (created) => {
        this.success = 'Benutzer wurde angelegt.';
        this.users.push(created);

        this.username = '';
        this.password = '';
        this.role = 'STUDENT';
      },
      error: (err) => {
        console.error('Fehler beim Anlegen des Benutzers', err);
        this.error = 'Benutzer konnte nicht angelegt werden.';
      }
    });
  }
}
