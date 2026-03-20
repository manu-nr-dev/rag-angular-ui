import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private baseUrl = 'http://localhost:8080/ai';

  constructor(private http: HttpClient) {}

  sendMessage(message: string, sessionId: string | null): Observable<any> {
    const body: any = { message };
    if (sessionId) {
      body.sessionId = sessionId;
    }
    return this.http.post(`${this.baseUrl}/chat`, body);
  }

  streamMessage(message: string): Observable<string> {
    return new Observable(observer => {
      fetch(`${this.baseUrl}/spring-ai/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }).then(response => {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        const read = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              observer.complete();
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            observer.next(chunk);
            read();
          });
        };
        read();
      }).catch(err => observer.error(err));
    });
  }
}