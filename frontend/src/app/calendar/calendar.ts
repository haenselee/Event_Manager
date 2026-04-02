import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  days: CalendarDay[] = [];
  monthName = '';
  year = 0;

  currentMonth = 0;
  currentYear = 0;

  allEvents: Event[] = [];

  constructor(
    private eventService: EventService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();

    this.buildMonth(this.currentYear, this.currentMonth);
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
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];

    for (let i = startWeekday; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push({
        date,
        events: [],
        inCurrentMonth: false
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        events: [],
        inCurrentMonth: true
      });
    }

    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const date = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1
      );

      days.push({
        date,
        events: [],
        inCurrentMonth: false
      });
    }

    this.days = days;

    if (this.allEvents.length > 0) {
      this.assignEventsToDays();
    }
  }

  private assignEventsToDays(): void {
    if (!this.days || this.days.length === 0) return;

    for (const day of this.days) {
      const year = day.date.getFullYear();
      const month = String(day.date.getMonth() + 1).padStart(2, '0');
      const date = String(day.date.getDate()).padStart(2, '0');
      const dayStr = `${year}-${month}-${date}`;

      day.events = this.allEvents.filter((e) => e.date === dayStr);
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
    this.router.navigate(['/events']);
  }
}
