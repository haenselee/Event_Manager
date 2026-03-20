import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationService, Registration } from '../registration';
import { AuthService } from '../auth';
import { PaymentService } from '../payment.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-registrations.html',
  styleUrl: './my-registrations.css'
})
export class MyRegistrationsComponent implements OnInit {

  registrations: Registration[] = [];
  regsByEvent = new Map<number, Registration[]>();

  loading = false;
  error = '';

  constructor(
    private regService: RegistrationService,
    private auth: AuthService,
    private paymentService: PaymentService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'Kein Benutzer eingeloggt.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.regService.getMyRegistrations(user.id).subscribe({
      next: (regs) => {
        this.zone.run(() => {
          this.registrations = regs;
          this.loading = false;

          const eventIds = Array.from(
            new Set(
              regs
                .map(r => r.event.id)
                .filter((id): id is number => id != null)
            )
          );

          if (eventIds.length === 0) {
            this.cdr.detectChanges();
            return;
          }

          forkJoin(eventIds.map(id => this.regService.getByEvent(id))).subscribe({
            next: (allResults) => {
              this.zone.run(() => {
                this.regsByEvent.clear();
                allResults.forEach((list, idx) => {
                  const evId = eventIds[idx];
                  this.regsByEvent.set(evId, list);
                });
                this.cdr.detectChanges();
              });
            },
            error: (err) => {
              console.error('Fehler beim Laden aller Teilnehmer', err);
              this.cdr.detectChanges();
            }
          });

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Laden der Anmeldungen', err);
          this.error = 'Fehler beim Laden deiner Anmeldungen.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getRegistrationsForEvent(eventId?: number): Registration[] {
    if (eventId == null) {
      return [];
    }
    return this.regsByEvent.get(eventId) || [];
  }

  pay(reg: Registration): void {
    if (!reg.id) {
      console.warn('Registrierung hat keine ID, Zahlung kann nicht gestartet werden.');
      return;
    }
    this.loading = true;

    this.paymentService.createCheckoutSession(reg.id).subscribe({
      next: (response) => {
        window.location.href = response.url;
      },
      error: (err) => {
        console.error('Fehler beim Starten der Zahlung', err);
        alert('Zahlung konnte nicht gestartet werden.');
        this.loading = false;
      }
    });
  }
}
