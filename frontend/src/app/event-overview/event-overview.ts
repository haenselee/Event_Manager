import { Component, EventEmitter, Output, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../event.service';
import { RegistrationService, Registration } from '../registration';
import { AuthService } from '../auth';
import { Event } from '../event.model';

@Component({
  selector: 'app-event-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-overview.html',
  styleUrl: './event-overview.css'
})
export class EventOverviewComponent implements OnInit {

  @Output() openChat = new EventEmitter<{ id: number; title: string }>();

  events: Event[] = [];
  regsByEvent = new Map<number, Registration[]>();
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

          // Für jedes Event die Registrierungen laden
          events.forEach(ev => {
            if (ev.id != null) {
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
}
