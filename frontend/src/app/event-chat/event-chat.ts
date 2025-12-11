import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Client, IMessage } from '@stomp/stompjs';

import { EventMessageService, EventChatMessage } from '../event-message';
import { AuthService } from '../auth';

@Component({
  selector: 'app-event-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-chat.html',
  styleUrl: './event-chat.css'
})
export class EventChatComponent implements OnInit, OnDestroy, OnChanges {

  @Input({ required: true }) event!: { id: number; title: string };

  messages: EventChatMessage[] = [];
  loading = false;
  error = '';
  newMessage = '';
  connecting = false;
  sending = false;

  private stompClient?: Client;

  constructor(
    private msgService: EventMessageService,
    private auth: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.event) {
      this.loadMessages();
      this.connectWebSocket();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event'] && this.event) {
      this.loadMessages();
      this.connectWebSocket();
    }
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = undefined;
    }
  }

  private connectWebSocket(): void {
    if (!this.event?.id) return;

    // ggf. alte Verbindung schließen
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = undefined;
    }

    this.connecting = true;
    this.cdr.detectChanges();

    const client = new Client({
      // Direkt auf den WS-Endpunkt zeigen
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      debug: () => {}  // Debug-Ausgaben deaktivieren
    });

    client.onConnect = () => {
      this.zone.run(() => {
        this.connecting = false;

        client.subscribe(`/topic/chat/${this.event.id}`, (message: IMessage) => {
          const body = JSON.parse(message.body) as EventChatMessage;
          this.zone.run(() => {
            this.messages.push(body);
            this.cdr.detectChanges();
          });
        });

        this.cdr.detectChanges();
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error', frame);
      this.zone.run(() => {
        this.error = 'Verbindung zum Chat nicht möglich.';
        this.connecting = false;
        this.cdr.detectChanges();
      });
    };

    client.onWebSocketError = (event) => {
      console.error('WebSocket error', event);
      this.zone.run(() => {
        this.error = 'WebSocket-Fehler beim Verbinden.';
        this.connecting = false;
        this.cdr.detectChanges();
      });
    };

    client.activate();
    this.stompClient = client;
  }

  loadMessages(): void {
    if (!this.event?.id) return;

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
          this.error = 'Nachrichten konnten nicht geladen werden.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  send(): void {
    const user = this.auth.currentUser;
    if (!user || !this.event?.id || !this.stompClient) return;

    const text = this.newMessage.trim();
    if (!text) return;

    this.sending = true;
    this.cdr.detectChanges();

    this.stompClient.publish({
      destination: `/app/chat/${this.event.id}`,
      body: JSON.stringify({
        eventId: this.event.id,
        authorId: user.id,
        content: text
      })
    });

    this.newMessage = '';
    this.sending = false;
    this.cdr.detectChanges();
  }

  isOwn(msg: EventChatMessage): boolean {
    const user = this.auth.currentUser;
    if (!user) return false;
    return msg.author.id === user.id;
  }
}
