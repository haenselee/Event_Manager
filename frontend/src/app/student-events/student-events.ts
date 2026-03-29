import { ChangeDetectorRef, Component, EventEmitter, NgZone, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../event.service';
import { Registration, RegistrationService } from '../registration';
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
  myRegistrations = new Map<number, Registration>();
  registrationsCountByEvent = new Map<number, number>();

  loading = false;
  error = '';
  regError = '';
  infoMessage = '';
  createError = '';
  priceLocked = false;

  newTitle = '';
  newDate = '';
  newLocation = '';
  newPrice: number | null = null;
  newDescription = '';
  newMaxParticipants: number | null = null;

  editMode = false;
  editingEventId: number | null = null;

  constructor(
    public auth: AuthService,
    private eventService: EventService,
    private regService: RegistrationService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadEditEventFromStorage();
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

          events.forEach((event) => {
            if (event.id != null) {
              this.regService.getByEvent(event.id).subscribe({
                next: (regs) => {
                  this.zone.run(() => {
                    this.registrationsCountByEvent.set(event.id!, regs.length);
                    this.cdr.detectChanges();
                  });
                },
                error: (err) => {
                  console.error('Fehler beim Laden der Teilnehmerzahl', err);
                }
              });
            }
          });

          if (this.auth.isStudent) {
            this.regService.getMyRegistrations(user.id).subscribe({
              next: (regs) => {
                this.zone.run(() => {
                  this.setMyRegistrations(regs);
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

  private setMyRegistrations(regs: Registration[]): void {
    this.myRegistrations.clear();

    const ids = regs
      .map((r) => {
        if (r.event.id != null) {
          this.myRegistrations.set(r.event.id, r);
        }
        return r.event.id;
      })
      .filter((id): id is number => id != null);

    this.registeredEventIds = new Set(ids);
  }

  private loadEditEventFromStorage(): void {
    const raw = localStorage.getItem('editEvent');

    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const event: Event = parsed.event ?? parsed;
      this.priceLocked = !!parsed.priceLocked;

      this.editMode = true;
      this.editingEventId = event.id ?? null;

      this.newTitle = event.title ?? '';
      this.newDate = event.date ?? '';
      this.newLocation = event.location ?? '';
      this.newPrice = event.price ?? 0;
      this.newDescription = event.description ?? '';
      this.newMaxParticipants = event.maxParticipants ?? null;

      this.infoMessage = this.priceLocked
        ? 'Event zum Bearbeiten geladen. Der Preis ist gesperrt, weil bereits Schüler bezahlt haben.'
        : 'Event zum Bearbeiten geladen.';
      this.createError = '';

      localStorage.removeItem('editEvent');
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Fehler beim Laden des Edit-Events aus localStorage', e);
      localStorage.removeItem('editEvent');
    }
  }

  saveEvent(): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) return;

    if (!this.newTitle.trim() || !this.newDate) {
      this.createError = 'Bitte mindestens Titel und Datum angeben.';
      this.infoMessage = '';
      this.cdr.detectChanges();
      return;
    }

    if (this.newMaxParticipants != null && this.newMaxParticipants < 1) {
      this.createError = 'Die Obergrenze muss mindestens 1 sein.';
      this.infoMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const payload: Event = {
      title: this.newTitle.trim(),
      date: this.newDate,
      location: this.newLocation.trim(),
      price: this.newPrice ?? 0,
      description: this.newDescription.trim(),
      maxParticipants: this.newMaxParticipants
    };

    if (this.editMode && this.editingEventId != null) {
      this.eventService.updateEvent(this.editingEventId, payload).subscribe({
        next: (updated) => {
          this.zone.run(() => {
            const index = this.events.findIndex((e) => e.id === updated.id);
            if (index !== -1) {
              this.events[index] = updated;
            }

            this.resetForm();
            this.editMode = false;
            this.editingEventId = null;
            this.priceLocked = false;
            this.createError = '';
            this.infoMessage = 'Event wurde aktualisiert.';
            this.cdr.detectChanges();
          });
        },
        error: (err: HttpErrorResponse) => {
          this.zone.run(() => {
            console.error('Fehler beim Aktualisieren des Events', err);
            this.createError = err.error?.message ?? err.error ?? 'Fehler beim Aktualisieren des Events.';
            this.infoMessage = '';
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.createEvent();
    }
  }

  createEvent(): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) return;

    if (!this.newTitle.trim() || !this.newDate) {
      this.createError = 'Bitte mindestens Titel und Datum angeben.';
      this.infoMessage = '';
      this.cdr.detectChanges();
      return;
    }

    if (this.newMaxParticipants != null && this.newMaxParticipants < 1) {
      this.createError = 'Die Obergrenze muss mindestens 1 sein.';
      this.infoMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const payload: Event = {
      title: this.newTitle.trim(),
      date: this.newDate,
      location: this.newLocation.trim(),
      price: this.newPrice ?? 0,
      description: this.newDescription.trim(),
      maxParticipants: this.newMaxParticipants
    };

    this.eventService.createEvent(payload).subscribe({
      next: (created) => {
        this.zone.run(() => {
          this.events.push(created);
          if (created.id != null) {
            this.registrationsCountByEvent.set(created.id, 0);
          }
          this.resetForm();
          this.createError = '';
          this.infoMessage = 'Event wurde erstellt.';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Erstellen des Events', err);
          this.createError = err.error?.message ?? 'Fehler beim Erstellen des Events.';
          this.infoMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.editMode = false;
    this.editingEventId = null;
    this.priceLocked = false;
    this.createError = '';
    this.infoMessage = '';
    localStorage.removeItem('editEvent');
    this.cdr.detectChanges();
  }

  deleteAllEvents(): void {
    if (!this.auth.isTeacher && !this.auth.isAdmin) return;

    this.eventService.deleteAllEvents().subscribe({
      next: () => {
        this.zone.run(() => {
          this.events = [];
          this.registeredEventIds.clear();
          this.myRegistrations.clear();
          this.registrationsCountByEvent.clear();
          this.resetForm();
          this.editMode = false;
          this.editingEventId = null;
          this.priceLocked = false;
          this.infoMessage = 'Alle Events wurden gelöscht.';
          this.createError = '';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Löschen der Events', err);
          this.createError = 'Fehler beim Löschen der Events.';
          this.infoMessage = '';
          this.cdr.detectChanges();
        });
      }
    });
  }

  private resetForm(): void {
    this.newTitle = '';
    this.newDate = '';
    this.newLocation = '';
    this.newPrice = null;
    this.newDescription = '';
    this.newMaxParticipants = null;
  }

  isRegistered(eventId: number): boolean {
    return this.registeredEventIds.has(eventId);
  }

  isPaidRegistration(eventId: number): boolean {
    return this.myRegistrations.get(eventId)?.paid ?? false;
  }

  getRegistrationCount(eventId: number): number {
    return this.registrationsCountByEvent.get(eventId) ?? 0;
  }

  getCapacityText(event: Event): string {
    if (event.id == null) {
      return '0/offen';
    }

    const current = this.getRegistrationCount(event.id);

    if (event.maxParticipants != null) {
      return `${current}/${event.maxParticipants}`;
    }

    return `${current}/offen`;
  }

  isEventFull(event: Event): boolean {
    if (event.id == null) return false;
    if (this.isRegistered(event.id)) return false;
    if (event.maxParticipants == null) return false;

    return this.getRegistrationCount(event.id) >= event.maxParticipants;
  }

  getRegistrationButtonLabel(event: Event): string {
    if (event.id == null) {
      return 'Anmelden';
    }

    if (!this.isRegistered(event.id)) {
      return this.isEventFull(event) ? 'Ausgebucht' : 'Anmelden';
    }

    if (this.isPaidRegistration(event.id)) {
      return 'Bereits bezahlt';
    }

    return 'Abmelden';
  }

  toggleRegistration(eventId?: number): void {
    const user = this.auth.currentUser;

    if (!user) return;
    if (!this.auth.isStudent) return;
    if (eventId == null) return;

    const event = this.events.find((e) => e.id === eventId);
    if (!event) return;

    if (this.isRegistered(eventId)) {
      if (this.isPaidRegistration(eventId)) {
        this.regError = 'Eine bezahlte Anmeldung kann nicht storniert werden.';
        this.cdr.detectChanges();
        return;
      }

      this.regService.unregister(user.id, eventId).subscribe({
        next: () => {
          this.zone.run(() => {
            this.registeredEventIds.delete(eventId);
            this.myRegistrations.delete(eventId);
            this.registrationsCountByEvent.set(
              eventId,
              Math.max(0, this.getRegistrationCount(eventId) - 1)
            );
            this.regError = '';
            this.cdr.detectChanges();
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler beim Abmelden', err);
          this.zone.run(() => {
            this.regError = err.error?.message ?? err.error ?? 'Fehler beim Abmelden.';
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      if (this.isEventFull(event)) {
        this.regError = 'Dieses Event ist bereits ausgebucht.';
        this.cdr.detectChanges();
        return;
      }

      this.regService.register(user.id, eventId).subscribe({
        next: (reg) => {
          this.zone.run(() => {
            const id = reg.event.id;
            if (id != null) {
              this.registeredEventIds.add(id);
              this.myRegistrations.set(id, reg);
              this.registrationsCountByEvent.set(id, this.getRegistrationCount(id) + 1);
            }
            this.regError = '';
            this.cdr.detectChanges();
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler beim Anmelden', err);
          this.zone.run(() => {
            this.regError = err.error?.message ?? err.error ?? 'Fehler beim Anmelden.';
            this.cdr.detectChanges();
          });
        }
      });
    }
  }
}
