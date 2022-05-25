import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserHttpService } from './user-http.service';
import io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  private socket:any;
  constructor(private us: UserHttpService) {}

  connect(event:string) : Observable<any> {
    this.socket = io(this.us.url);
    return new Observable((observer) => {
      this.socket.on(event, (arg:any) => {
        console.log('Socket.io message received: ' + JSON.stringify(arg));
        observer.next(arg);
      });
      this.socket.on('error', (err:any) => {
        console.log('Socket.io error: ' + err);
        observer.error(err);
      });
      const sck = this.socket; // TODO check if this works
      return {
        unsubscribe() {
          sck.disconnect();
        }
      }
    });
  }
}
