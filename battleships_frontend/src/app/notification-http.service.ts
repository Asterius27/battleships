import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserHttpService } from './user-http.service';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface Notification {
  _id: string,
  user: string,
  friend_request: boolean,
  match_invite: boolean,
  friend_request_accepted: boolean,
  friend_messages: string[],
  moderator_messages: string[],
  match_alerts: string[]
}

@Injectable({
  providedIn: 'root'
})
export class NotificationHttpService {

  constructor(private http: HttpClient, private us: UserHttpService) {
    console.log("Notification service instantiated");
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

  get_notifications() : Observable<Notification> {
    return this.http.get<Notification>(this.us.url + '/notifications', this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  delete_notification(body:any) : Observable<any> {
    return this.http.patch<any>(this.us.url + '/notifications', body, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }
}
