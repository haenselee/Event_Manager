import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth';

interface AdminUser {
  id: number;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

type SortColumn = 'id' | 'username' | 'role';
type SortDirection = 'asc' | 'desc';

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

  sortColumn: SortColumn = 'id';
  sortDirection: SortDirection = 'asc';

  private usersApi = 'http://localhost:8080/api/users';
  private registerApi = 'http://localhost:8080/api/auth/register';

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

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

    this.http.post(this.registerApi, body).subscribe({
      next: () => {
        this.success = 'Benutzer wurde angelegt.';
        this.username = '';
        this.password = '';
        this.role = 'STUDENT';
        this.loadUsers();
      },
      error: (err) => {
        console.error('Fehler beim Anlegen des Benutzers', err);
        this.error = err?.error?.message ?? 'Benutzer konnte nicht angelegt werden.';
      }
    });
  }

  deleteUser(user: AdminUser): void {
    if (this.auth.currentUser?.id === user.id) {
      this.error = 'Du kannst deinen eigenen Admin-Benutzer nicht löschen.';
      this.success = '';
      return;
    }

    this.error = '';
    this.success = '';

    this.http.delete<void>(`${this.usersApi}/${user.id}`).subscribe({
      next: () => {
        this.success = 'Benutzer wurde gelöscht.';
        this.users = this.users.filter((u) => u.id !== user.id);
      },
      error: (err) => {
        console.error('Fehler beim Löschen des Benutzers', err);
        this.error = err?.error?.message ?? 'Benutzer konnte nicht gelöscht werden.';
      }
    });
  }

  setSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getSortedUsers(): AdminUser[] {
    const list = [...this.users];
    const multiplier = this.sortDirection === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      switch (this.sortColumn) {
        case 'id':
          return (a.id - b.id) * multiplier;
        case 'username':
          return a.username.localeCompare(b.username, 'de', { sensitivity: 'base' }) * multiplier;
        case 'role':
          return a.role.localeCompare(b.role, 'de', { sensitivity: 'base' }) * multiplier;
      }
    });
  }
}
