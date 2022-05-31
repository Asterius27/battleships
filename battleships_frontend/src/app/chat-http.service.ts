import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserHttpService } from './user-http.service';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Chat {
  _id: string,
  participants: string[],
  messages: string[],
  type: string
}

@Injectable({
  providedIn: 'root'
})
export class ChatHttpService {

  constructor(private http: HttpClient, private us: UserHttpService) {
    // console.log('Chat service instantiated');
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, ` + 'body was: ' + JSON.stringify(error.error));
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  private create_options(params = {}) {
    return {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + this.us.get_token(),
        'cache-control': 'no-cache',
        'Content-Type':  'application/json',
      }),
      params: new HttpParams({fromObject: params})
    };
  }

  get_chat(id:string) : Observable<Chat> {
    return this.http.get<Chat>(this.us.url + '/chats/chat/' + id, this.create_options()).pipe(
      tap({
        next: (data) => {
          // console.log(JSON.stringify(data));
        },
        error: catchError(this.handleError)
      })
    );
  }

  get_moderator_chats(id:string) : Observable<Chat[]> {
    return this.http.get<Chat[]>(this.us.url + '/chats/moderator/' + id, this.create_options()).pipe(
      tap({
        next: (data) => {
          // console.log(JSON.stringify(data));
        },
        error: catchError(this.handleError)
      })
    );
  }

  get_friends_chat() : Observable<Chat[]> {
    return this.http.get<Chat[]>(this.us.url + '/chats/friends', this.create_options()).pipe(
      tap({
        next: (data) => {
          // console.log(JSON.stringify(data));
        },
        error: catchError(this.handleError)
      })
    );
  }

  get_friend_chat(friend_id:string) : Observable<Chat> {
    return this.http.get<Chat>(this.us.url + '/chats/friends/' + friend_id, this.create_options()).pipe(
      tap({
        next: (data) => {
          // console.log(JSON.stringify(data));
        },
        error: catchError(this.handleError)
      })
    );
  }

  post_chat(c:Chat) : Observable<Chat> {
    // console.log('Posting ' + JSON.stringify(c));
    return this.http.post<Chat>(this.us.url + '/chats', c, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }

  post_chat_participant(id:string) : Observable<Chat> {
    // console.log('Posting...');
    return this.http.post<Chat>(this.us.url + '/chats/' + id + '/participants', {}, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }
}
