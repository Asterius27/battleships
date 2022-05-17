import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserHttpService } from './user-http.service';
import { catchError, Observable, tap, throwError } from 'rxjs';

interface Match {
  id: string,
  playerOne: string,
  playerTwo: string,
  gridOne: string[][],
  gridTwo: string[][],
  startingPlayer: string,
  moves: string[],
  result: string,
  createdAt: Date
}

@Injectable({
  providedIn: 'root'
})
export class MatchHttpService {

  constructor(private http: HttpClient, private us: UserHttpService) {
    console.log('Match service instantiated');
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

  post_match(m:Match) : Observable<any> {
    return this.http.post<any>(this.us.url + '/matches', m, this.create_options()).pipe(
      catchError(this.handleError)
    );
  }

  post_grid(id:string, body:any) : Observable<Match> {
    return this.http.post<Match>(this.us.url + '/matches/' + id + '/grid', body, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  post_move(id:string, body:any) : Observable<Match> {
    return this.http.post<Match>(this.us.url + '/matches/' + id + '/move', body, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  get_match(id:string) : Observable<Match> {
    return this.http.get<Match>(this.us.url + '/matches/id/' + id, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  get_user_matches() : Observable<Match[]> {
    return this.http.get<Match[]>(this.us.url + '/matches/mymatches', this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  get_random_grid() : Observable<any> {
    return this.http.get<any>(this.us.url + '/matches/grid', this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  get_ongoing_matches() : Observable<Match[]> {
    return this.http.get<Match[]>(this.us.url + '/matches/ongoing', this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  post_queue() : Observable<any> {
    return this.http.post<any>(this.us.url + '/matchmaking/queue', {}, this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }

  delete_queue() : Observable<any> {
    return this.http.delete<any>(this.us.url + '/matchmaking/queue', this.create_options()).pipe(
      tap({
        next: (data) => {console.log(JSON.stringify(data));},
        error: catchError(this.handleError)
      })
    );
  }
}
