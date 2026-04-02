import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventChatComponent } from './event-chat';

@Component({
  selector: 'app-event-chat-page',
  standalone: true,
  imports: [CommonModule, EventChatComponent],
  template: `
    <ng-container *ngIf="event; else missingEvent">
      <app-event-chat [event]="event"></app-event-chat>
    </ng-container>

    <ng-template #missingEvent>
      <div class="page-section">
        <p>Event-Chat konnte nicht geladen werden.</p>
        <button type="button" (click)="goBack()">Zurück zur Startseite</button>
      </div>
    </ng-template>
  `
})
export class EventChatPageComponent {
  event: { id: number; title: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      const title = this.route.snapshot.queryParamMap.get('title') ?? 'Event-Chat';

      if (!Number.isNaN(id) && id > 0) {
        this.event = { id, title };
      } else {
        this.event = null;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }
}
