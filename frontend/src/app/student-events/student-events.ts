import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../event.service';
import { RegistrationService } from '../registration';
import { AuthService } from '../auth';
import { Event } from '../event.model';

@Component({
  selector: 'app-student-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-events.html',
  styleUrl: './student-events.css'
})
export class StudentEventsComponent implements OnInit {

  @Output() openChat = new EventEmitter<{ id: number; title: string }>();

  events: Event[] = [];
  registeredEventIds = new Set<number>();

  loading = false;
  error = '';
  regError = '';
  infoMessage = '';
  createError = '';

  // Eingabefelder für Lehrer/Admin
  newTitle = '';
  newDate = '';          // yyyy-MM-dd
  newLocation = '';
  newPrice: number | null = null;
  newDescription = '';

  constructor(
    public auth: AuthService,
    private eventService: EventService,
    private regService: RegistrationService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'Kein Benutzer eingeloggt.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.zone.run(() => {
          this.events = events;
          this.loading = false;

          // Registrierungen nur für Schüler laden
          if (this.auth.isStudent) {
            this.regService.getMyRegistrations(user.id).subscribe({
              next: (regs) => {
                this.zone.run(() => {
                  const ids = regs
                    .map(r => r.event.id)
                    .filter((id): id is number => id != null);
                  this.registeredEventIds = new Set(ids);
                  this.cdr.detectChanges();
                });
              },
              error: (err) => {
                this.zone.run(() => {
                  console.error('Fehler bei Registrierungen', err);
                  this.regError = 'Deine Anmeldungen konnten nicht geladen werden.';
                  this.cdr.detectChanges();
                });
              }
            });
          }

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Laden der Events', err);
          this.error = 'Fehler beim Laden der Events.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --------- Lehrer/Admin: Event erstellen & löschen ---------

  createEvent(): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) return;

    if (!this.newTitle.trim() || !this.newDate) {
      this.createError = 'Bitte mindestens Titel und Datum angeben.';
      this.infoMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const payload: Event = {
      title: this.newTitle.trim(),
      date: this.newDate,
      location: this.newLocation.trim(),
      price: this.newPrice ?? 0,
      description: this.newDescription.trim()
    };

    this.eventService.createEvent(payload).subscribe({
      next: (created) => {
        this.zone.run(() => {
          this.events.push(created);

          this.newTitle = '';
          this.newDate = '';
          this.newLocation = '';
          this.newPrice = null;
          this.newDescription = '';

          this.createError = '';
          this.infoMessage = 'Event wurde erstellt.';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Erstellen des Events', err);
          this.createError = 'Fehler beim Erstellen des Events.';
          this.infoMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteAllEvents(): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) return;

    this.eventService.deleteAllEvents().subscribe({
      next: () => {
        this.zone.run(() => {
          this.events = [];
          this.registeredEventIds.clear();
          this.infoMessage = 'Alle Events wurden gelöscht.';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Löschen der Events', err);
          this.createError = 'Fehler beim Löschen der Events.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --------- Schüler: An-/Abmelden ---------

  isRegistered(eventId: number): boolean {
    return this.registeredEventIds.has(eventId);
  }

  toggleRegistration(eventId?: number): void {
    const user = this.auth.currentUser;
    if (!user) return;
    if (!this.auth.isStudent) return;
    if (eventId == null) {
      console.warn('Event ohne ID, kann nicht registrieren/abmelden.');
      return;
    }

    if (this.isRegistered(eventId)) {
      this.regService.unregister(user.id, eventId).subscribe({
        next: () => {
          this.zone.run(() => {
            this.registeredEventIds.delete(eventId);
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('Fehler beim Abmelden', err);
        }
      });
    } else {
      this.regService.register(user.id, eventId).subscribe({
        next: (reg) => {
          this.zone.run(() => {
            const id = reg.event.id;
            if (id != null) {
              this.registeredEventIds.add(id);
            }
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('Fehler beim Anmelden', err);
        }
      });
    }
  }
}
