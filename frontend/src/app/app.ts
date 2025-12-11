import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { LoginComponent } from './login/login';
import { AdminComponent } from './admin/admin';
import { StudentEventsComponent } from './student-events/student-events';
import { MyRegistrationsComponent } from './my-registrations/my-registrations';
import { CalendarComponent } from './calendar/calendar';
import { EventOverviewComponent } from './event-overview/event-overview';
import { EventChatComponent } from './event-chat/event-chat';
import { AuthService } from './auth';
import { AuthUser } from './auth-user';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    LoginComponent,
    AdminComponent,
    StudentEventsComponent,
    MyRegistrationsComponent,
    CalendarComponent,
    EventOverviewComponent,
    EventChatComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {

  activePage: 'events' | 'calendar' | 'my-registrations' | 'admin' | 'event-info' | 'event-chat'
    = 'events';

  selectedChatEvent: { id: number; title: string } | null = null;

  constructor(
    public auth: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  setPage(page: 'events' | 'calendar' | 'my-registrations' | 'admin' | 'event-info' | 'event-chat') {
    this.zone.run(() => {
      this.activePage = page;
      this.cdr.detectChanges();
    });
  }

  onOpenChat(ev: { id: number; title: string }) {
    this.zone.run(() => {
      this.selectedChatEvent = ev;
      this.activePage = 'event-chat';
      this.cdr.detectChanges();
    });
  }

  logout(): void {
    this.zone.run(() => {
      this.auth.logout();
      this.activePage = 'events';
      this.selectedChatEvent = null;
      this.cdr.detectChanges();
    });
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
