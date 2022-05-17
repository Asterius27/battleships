import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Message {
  id: string,
  owner: string,
  content: string,
  createdAt: Date
}

@Injectable({
  providedIn: 'root'
})
export class MessageHttpService {

  constructor(private http: HttpClient, private us: UserHttpService) {
    console.log('Message service instantiated');
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

  get_message(id:string) : Observable<Message> {
    return this.http.get<Message>(this.us.url + '/messages/' + id, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  post_message(m:Message) : Observable<Message> {
    console.log('Posting ' + JSON.stringify(m));
    return this.http.post<Message>(this.us.url + '/messages', m, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }
}
