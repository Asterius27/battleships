import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserHttpService } from './user-http.service';
import { catchError, Observable, tap, throwError } from 'rxjs';

interface User {
  name: string,
  surname: string,
  username: string,
  mail: string,
  role: string,
  friends_list: string[],
  friend_requests: string[],
  match_invites: string[],
  temporary: boolean
}

@Injectable({
  providedIn: 'root'
})
export class UsersHttpService {

  constructor(private http: HttpClient, private us: UserHttpService) {
    console.log('Users service instantiated');
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

  get_user_username(username:string) : Observable<User> {
    return this.http.get<User>(this.us.url + '/users/username/' + username, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  get_user_id(id:string) : Observable<User> {
    return this.http.get<User>(this.us.url + '/users/id/' + id, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  post_moderator_user(u:User) : Observable<any> {
    return this.http.post<any>(this.us.url + '/users/moderator', u, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }

  patch_user(username:string, u:User) : Observable<any> {
    return this.http.patch<any>(this.us.url + '/users/' + username, u, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  delete_user(username:string) : Observable<any> {
    return this.http.delete<any>(this.us.url + '/users/' + username, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }

  post_friend(body:any) : Observable<User> {
    return this.http.post<User>(this.us.url + '/friends/request', body, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  post_friend_match(body:any) : Observable<any> {
    return this.http.post<any>(this.us.url + '/friends/play', body, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  delete_friend(username:string) : Observable<User> {
    return this.http.delete<User>(this.us.url + '/friends/' + username, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }
}
