import { Component, EventEmitter, OnInit, Output, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../event.service';
import { Event } from '../event.model';

interface CalendarDay {
  date: Date;
  events: Event[];
  inCurrentMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent implements OnInit {

  @Output() goToEvents = new EventEmitter<void>();

  days: CalendarDay[] = [];
  monthName = '';
  year = 0;

  currentMonth = 0; // 0 = Jan
  currentYear = 0;

  allEvents: Event[] = [];

  constructor(
    private eventService: EventService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();

    // Monat sofort aufbauen
    this.buildMonth(this.currentYear, this.currentMonth);

    // Events laden
    this.loadEvents();
  }

  private loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.zone.run(() => {
          this.allEvents = events;
          this.assignEventsToDays();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Fehler beim Laden der Events für den Kalender', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  private buildMonth(year: number, month: number): void {
    this.year = year;
    this.monthName = new Date(year, month, 1).toLocaleString('de-AT', { month: 'long' });

    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // 0=Mo ... 6=So (Montag-basiert)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];

    // Tage vor dem 1. des Monats
    for (let i = 0; i < startWeekday; i++) {
      const date = new Date(year, month, -i);
      days.unshift({ date, events: [], inCurrentMonth: false });
    }

    // Tage des Monats
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({ date, events: [], inCurrentMonth: true });
    }

    // Rest auffüllen bis volle Wochen
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      days.push({ date, events: [], inCurrentMonth: false });
    }

    this.days = days;

    // vorhandene Events zuordnen
    if (this.allEvents.length > 0) {
      this.assignEventsToDays();
    }
  }

  private assignEventsToDays(): void {
    if (!this.days || this.days.length === 0) return;

    for (const day of this.days) {
      const dayStr = day.date.toISOString().slice(0, 10); // YYYY-MM-DD
      day.events = this.allEvents.filter(e => e.date === dayStr);
    }
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.buildMonth(this.currentYear, this.currentMonth);
    this.cdr.detectChanges();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.buildMonth(this.currentYear, this.currentMonth);
    this.cdr.detectChanges();
  }

  onEventClick(): void {
    this.goToEvents.emit(); // AppComponent setzt dann activePage='events'
  }
}
