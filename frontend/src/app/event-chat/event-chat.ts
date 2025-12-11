import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventMessageService, EventChatMessage } from '../event-message';
import { AuthService } from '../auth';

@Component({
  selector: 'app-event-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-chat.html',
  styleUrl: './event-chat.css'
})
export class EventChatComponent implements OnInit, OnChanges {

  @Input({ required: true }) event!: { id: number; title: string };

  messages: EventChatMessage[] = [];
  loading = false;
  sending = false;
  error = '';
  newMessage = '';

  constructor(
    private msgService: EventMessageService,
    private auth: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.event) {
      this.loadMessages();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event'] && this.event) {
      this.loadMessages();
    }
  }

  loadMessages(): void {
    if (!this.event?.id) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.msgService.getMessages(this.event.id).subscribe({
      next: (msgs) => {
        this.zone.run(() => {
          this.messages = msgs;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Fehler beim Laden der Nachrichten', err);
        this.zone.run(() => {
          this.error = 'Fehler beim Laden der Nachrichten.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  send(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'Nicht eingeloggt.';
      return;
    }
    if (!this.event?.id) return;
    if (!this.newMessage.trim()) return;

    const content = this.newMessage.trim();
    this.sending = true;
    this.cdr.detectChanges();

    this.msgService.sendMessage(this.event.id, user.id, content).subscribe({
      next: (msg) => {
        this.zone.run(() => {
          this.messages.push(msg);
          this.newMessage = '';
          this.sending = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Fehler beim Senden der Nachricht', err);
        this.zone.run(() => {
          this.error = 'Nachricht konnte nicht gesendet werden.';
          this.sending = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  isOwn(msg: EventChatMessage): boolean {
    const user = this.auth.currentUser;
    if (!user) return false;
    return msg.author.id === user.id;
  }
}
