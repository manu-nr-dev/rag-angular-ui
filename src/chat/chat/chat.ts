import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChatService } from "../../services/chat";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  costInr?: number;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent { 
   @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: Message[] = [];
  userInput = '';
  sessionId: string | null = null;
  isLoading = false;
  useStreaming = false;

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  trackByIndex(index: number): number {
    return index;
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  sendMessage() {
    const message = this.userInput.trim();
    if (!message || this.isLoading) return;

    this.messages = [...this.messages, { role: 'user', content: message }];
    this.userInput = '';
    this.isLoading = true;
    this.cdr.markForCheck();
    this.scrollToBottom();

    if (this.useStreaming) {
      this.sendStreaming(message);
    } else {
      this.sendNormal(message);
    }
  }

  sendNormal(message: string) {
    this.chatService.sendMessage(message, this.sessionId).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.sessionId = response.sessionId;
          this.messages = [...this.messages, {
            role: 'assistant',
            content: response.reply,
            promptTokens: response.promptTokens,
            completionTokens: response.completionTokens,
            totalTokens: response.totalTokens,
            costUsd: response.costUsd,
            costInr: response.costInr
          }];
          this.isLoading = false;
          this.cdr.markForCheck();
          this.scrollToBottom();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.messages = [...this.messages, { role: 'assistant', content: 'Error: ' + (err.error?.message || 'Something went wrong') }];
          this.isLoading = false;
          this.cdr.markForCheck();
          this.scrollToBottom();
        });
      }
    });
  }

  sendStreaming(message: string) {
    this.messages = [...this.messages, { role: 'assistant', content: '', streaming: true }];
    const assistantIndex = this.messages.length - 1;
    this.cdr.markForCheck();

    this.chatService.streamMessage(message).subscribe({
      next: (chunk) => {
        this.ngZone.run(() => {
          this.messages[assistantIndex].content += chunk;
          this.cdr.markForCheck();
          this.scrollToBottom();
        });
      },
      complete: () => {
        this.ngZone.run(() => {
          this.messages[assistantIndex].streaming = false;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.messages[assistantIndex].content = 'Streaming error occurred.';
          this.messages[assistantIndex].streaming = false;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages = [];
    this.sessionId = null;
    this.cdr.markForCheck();
  }

 } // paste all existing AppComponent logic here