import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from './event.model';
import { Role } from './auth-user';

export interface Registration {
  id: number;
  student: {
    id: number;
    username: string;
    role: Role;
  };
  event: Event;
  registeredAt: string;
  paid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private apiUrl = 'http://localhost:8080/api/registrations';

  constructor(private http: HttpClient) {}

  getMyRegistrations(studentId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/me?studentId=${studentId}`);
  }

  register(studentId: number, eventId: number): Observable<Registration> {
    return this.http.post<Registration>(`${this.apiUrl}?studentId=${studentId}&eventId=${eventId}`, {});
  }

  unregister(studentId: number, eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}?studentId=${studentId}&eventId=${eventId}`);
  }

  // ⬇️ NEU: alle Registrierungen für ein Event (für Schüler-Übersicht & Lehrer-Seite)
  getByEvent(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/by-event?eventId=${eventId}`);
  }

  // ⬇️ NEU: Zahlung auslösen
  pay(studentId: number, eventId: number): Observable<Registration> {
    return this.http.post<Registration>(`${this.apiUrl}/pay?studentId=${studentId}&eventId=${eventId}`, {});
  }
}
