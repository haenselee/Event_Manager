import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from './auth-user';

export interface EventChatMessage {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    role: Role;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EventMessageService {

  private apiUrl = 'http://localhost:8080/api/event-messages';

  constructor(private http: HttpClient) {}

  getMessages(eventId: number): Observable<EventChatMessage[]> {
    return this.http.get<EventChatMessage[]>(`${this.apiUrl}?eventId=${eventId}`);
  }

  sendMessage(eventId: number, authorId: number, content: string): Observable<EventChatMessage> {
    return this.http.post<EventChatMessage>(this.apiUrl, {
      eventId,
      authorId,
      content
    });
  }
}
