import { ChangeDetectorRef, Component, EventEmitter, NgZone, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../event.service';
import { Registration, RegistrationService } from '../registration';
import { AuthService } from '../auth';
import { Event } from '../event.model';

interface SortState {
  column: 'student' | 'registeredAt' | 'paid';
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-event-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-overview.html',
  styleUrl: './event-overview.css'
})
export class EventOverviewComponent implements OnInit {

  @Output() openChat = new EventEmitter<{ id: number; title: string }>();

  events: Event[] = [];
  regsByEvent = new Map<number, Registration[]>();
  sortByEvent = new Map<number, SortState>();
  searchByEvent = new Map<number, string>();

  loading = false;
  error = '';

  constructor(
    private eventService: EventService,
    private regService: RegistrationService,
    public auth: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.zone.run(() => {
          this.events = events;
          this.loading = false;

          events.forEach((ev) => {
            if (ev.id != null) {
              this.sortByEvent.set(ev.id, { column: 'student', direction: 'asc' });
              this.searchByEvent.set(ev.id, '');

              this.regService.getByEvent(ev.id).subscribe({
                next: (regs) => {
                  this.zone.run(() => {
                    this.regsByEvent.set(ev.id!, regs);
                    this.cdr.detectChanges();
                  });
                },
                error: (err) => {
                  console.error('Fehler beim Laden der Anmeldungen für Event', ev.id, err);
                }
              });
            }
          });

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Fehler beim Laden der Events in EventOverview', err);
        this.zone.run(() => {
          this.error = 'Events konnten nicht geladen werden.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getRegistrations(id: number): Registration[] {
    return this.regsByEvent.get(id) || [];
  }

  getSearchTerm(eventId: number): string {
    return this.searchByEvent.get(eventId) || '';
  }

  setSearchTerm(eventId: number, value: string): void {
    this.searchByEvent.set(eventId, value);
  }

  clearSearch(eventId: number): void {
    this.searchByEvent.set(eventId, '');
    this.cdr.detectChanges();
  }

  getFilteredAndSortedRegistrations(eventId: number): Registration[] {
    const regs = [...this.getRegistrations(eventId)];
    const searchTerm = this.getSearchTerm(eventId).trim().toLowerCase();

    const filtered = searchTerm
      ? regs.filter((reg) => reg.student.username.toLowerCase().includes(searchTerm))
      : regs;

    const sortState = this.sortByEvent.get(eventId) ?? { column: 'student', direction: 'asc' };
    const multiplier = sortState.direction === 'asc' ? 1 : -1;

    return filtered.sort((a, b) => {
      switch (sortState.column) {
        case 'student':
          return a.student.username.localeCompare(b.student.username, 'de', { sensitivity: 'base' }) * multiplier;

        case 'registeredAt':
          return (new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()) * multiplier;

        case 'paid':
          if (a.paid === b.paid) {
            return a.student.username.localeCompare(b.student.username, 'de', { sensitivity: 'base' }) * multiplier;
          }
          return ((a.paid ? 1 : 0) - (b.paid ? 1 : 0)) * multiplier;
      }
    });
  }

  getRegisteredCount(eventId: number): number {
    return this.getRegistrations(eventId).length;
  }

  getPaidCount(eventId: number): number {
    return this.getRegistrations(eventId).filter((reg) => reg.paid).length;
  }

  getCapacityLabel(event: Event): string {
    const current = this.getRegisteredCount(event.id!);

    if (event.maxParticipants != null) {
      return `${current}/${event.maxParticipants}`;
    }

    return `${current}/offen`;
  }

  hasPaidRegistrations(eventId: number): boolean {
    return this.getPaidCount(eventId) > 0;
  }

  setSort(eventId: number, column: 'student' | 'registeredAt' | 'paid'): void {
    const current = this.sortByEvent.get(eventId);

    if (current?.column === column) {
      this.sortByEvent.set(eventId, {
        column,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      this.sortByEvent.set(eventId, {
        column,
        direction: 'asc'
      });
    }
  }

  getSortIndicator(eventId: number, column: 'student' | 'registeredAt' | 'paid'): string {
    const current = this.sortByEvent.get(eventId);

    if (!current || current.column !== column) {
      return '';
    }

    return current.direction === 'asc' ? '↑' : '↓';
  }

  editEvent(event: Event): void {
    const payload = {
      event,
      priceLocked: event.id != null ? this.hasPaidRegistrations(event.id) : false
    };

    localStorage.setItem('editEvent', JSON.stringify(payload));
    window.location.href = '/student-events';
  }

  removeRegistration(eventId: number, registration: Registration): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) {
      return;
    }

    if (registration.paid) {
      alert('Bezahlte Anmeldungen können nicht entfernt werden.');
      return;
    }

    this.regService.unregisterByRegistrationId(registration.id).subscribe({
      next: () => {
        this.zone.run(() => {
          const updatedRegs = this.getRegistrations(eventId).filter((reg) => reg.id !== registration.id);
          this.regsByEvent.set(eventId, updatedRegs);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Fehler beim Abmelden des Schülers', err);
        alert(err?.error?.message ?? err?.error ?? 'Fehler beim Abmelden des Schülers.');
      }
    });
  }

  deleteEvent(eventId?: number): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) return;
    if (eventId == null) return;

    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        alert('Event wurde gelöscht.');
        window.location.href = '/student-events';
      },
      error: (err) => {
        console.error('Fehler beim Löschen des Events', err);
        alert('Fehler beim Löschen des Events.');
      }
    });
  }
}
