import { Component, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent.html',
  styleUrls: ['./agent.scss']
})
export class AgentComponent implements OnDestroy {
  taskInput = '';
  status: 'idle' | 'submitting' | 'waiting' | 'done' | 'error' = 'idle';
  requestId: string | null = null;
  result: any = null;
  errorMessage: string | null = null;

  private stompClient: Client | null = null;

  constructor(
    private http: HttpClient, 
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef // Inject this to force UI updates
  ) { }

  submitTask() {
    if (!this.taskInput.trim()) return;

    this.status = 'submitting';
    this.result = null;
    this.cdr.detectChanges(); // Force "submitting" state to show

    this.initStomp((client) => {
      this.http.post<{ requestId: string }>(
        'http://localhost:8082/agent/async',
        { task: this.taskInput }
      ).subscribe({
        next: ({ requestId }) => {
          this.ngZone.run(() => {
            this.requestId = requestId;
            this.status = 'waiting';
            this.cdr.detectChanges(); // Force "waiting" state
          });

          client.subscribe(`/topic/results/${requestId}`, (message: IMessage) => {
            this.handleIncomingMessage(message, requestId);
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.status = 'error';
            this.errorMessage = 'Backend error.';
            this.cdr.detectChanges();
          });
        }
      });
    });
  }

  private handleIncomingMessage(message: IMessage, originalId: string) {
    // The Critical Fix: Ensure everything happens inside the Zone + Force Refresh
    this.ngZone.run(() => {
      try {
        const data = JSON.parse(message.body);
        const res = data?.result ?? data;

        this.result = {
          requestId: res?.requestId ?? originalId,
          answer: res?.answer ?? res?.output ?? res?.text ?? message.body,
          toolCallsUsed: res?.toolsInvoked?.length ?? 0,
          iterationsUsed: res?.iterationsUsed ?? 0,
          costTokens: res?.totalTokensUsed ?? 0,
          status: res?.status ?? 'done'
        };

        this.status = 'done';
        console.log('Result assigned:', this.result);
        
        // This is the "Be Ultimate" move: Force Angular to redraw the DOM NOW
        this.cdr.detectChanges(); 
        
        this.stompClient?.deactivate();
      } catch (e) {
        this.status = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  private initStomp(onConnected: (client: Client) => void) {
    if (this.stompClient?.connected) {
      onConnected(this.stompClient);
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8082/ws'),
      reconnectDelay: 5000,
      debug: (msg) => console.log('STOMP:', msg)
    });

    this.stompClient.onConnect = () => {
      this.ngZone.run(() => onConnected(this.stompClient!));
    };

    this.stompClient.activate();
  }

  ngOnDestroy() {
    this.stompClient?.deactivate();
  }

  reset() {
    this.status = 'idle';
    this.result = null;
    this.taskInput = '';
    this.cdr.detectChanges();
  }
}