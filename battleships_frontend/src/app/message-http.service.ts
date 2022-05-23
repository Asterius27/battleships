import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Message {
  _id: string,
  owner: string,
  owner_username: string,
  content: string,
  createdAt: string
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

  private create_options(paramone = {}, paramtwo = "") {
    let httpParams = new HttpParams({fromObject: paramone});
    if (paramtwo !== "") {
      httpParams = httpParams.append('visibility', paramtwo);
    }
    return {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + this.us.get_token(),
        'cache-control': 'no-cache',
        'Content-Type':  'application/json',
      }),
      params: httpParams
    };
  }

  // never used
  get_message(id:string) : Observable<Message> {
    return this.http.get<Message>(this.us.url + '/messages/' + id, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  get_messages(ids:string[], visibility:string) : Observable<Message[]> {
    return this.http.get<Message[]>(this.us.url + '/messages', this.create_options({ids: ids}, visibility)).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  post_message(body:any) : Observable<Message> {
    console.log('Posting ' + JSON.stringify(body));
    return this.http.post<Message>(this.us.url + '/messages', body, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }
}
