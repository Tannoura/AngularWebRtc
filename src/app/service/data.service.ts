import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Message } from '../Interface/message';

export const WS_ENDPOINT = 'ws://localhost:8081';

@Injectable({
  providedIn: 'root'
})
export class DataService {


  private socket$!: WebSocketSubject<Message>;

  private messageSubject = new Subject<Message>();
  public message$ = this.messageSubject.asObservable();
  constructor() { }


  public connect(): void {

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();

      this.socket$.subscribe(
        // Called whenever there is a message from the server
        msg => {
          console.log('Received message of type: ' + msg.type);
          this.messageSubject.next(msg);
        }
      );
    }
  }

  sendMessage(message: Message): void {
  console.log('sending message', message.type);
  this.socket$.next(message);
  }

  private getNewWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: WS_ENDPOINT,
      openObserver:
      {
        next: () => {
          console.log('connection ok');
        }
      },
      closeObserver: {
        next: () => {
          console.log('connection closed');
          this.socket$ = undefined!;
          this.connect();
        }
      }
    });


  }
}
