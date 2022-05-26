import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserHttpService } from './user-http.service';
import io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private socket:any = null;
  constructor(private us: UserHttpService) {}

  connect(event:string) : Observable<any> {
    if (this.socket === null) {
      this.socket = io(this.us.url);
    }
    return new Observable((observer) => {
      this.socket.on(event, (arg:any) => {
        console.log('Socket.io message received: ' + event);
        observer.next(arg);
      });
      this.socket.on('error', (err:any) => {
        console.log('Socket.io error: ' + err);
        observer.error(err);
      });
    });
  }

  disconnect() {
    if (this.socket !== null) {
      this.socket.disconnect();
    }
  }
}
