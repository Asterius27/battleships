import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import jwtdecode from 'jwt-decode';

interface TokenData {
  username: string,
  name: string,
  surname: string,
  mail: string,
  role: string,
  id: string
}

// FIXME invalid token after page refresh

@Injectable({
  providedIn: 'root'
})
export class UserHttpService {

  private token = '';
  public url = 'http://localhost:8000';

  constructor(private http: HttpClient) {
    console.log('User service instantiated');
    if (!localStorage.getItem('battleships_token')) {
      console.log("No token found in local storage");
      this.token = "";
    } else {
      this.token = JSON.stringify(localStorage.getItem('battleships_token') || "");
      console.log("JWT loaded from local storage");
    }
  }

  login(username: string, password: string, remember: boolean): Observable<any> {
    console.log('Login: ' + username + ' ' + password);
    const options = {
      headers: new HttpHeaders({
        authorization: 'Basic ' + btoa(username + ':' + password),
        'cache-control': 'no-cache',
        'Content-Type':  'application/x-www-form-urlencoded',
      })
    };
    return this.http.get(this.url + '/login', options).pipe(
      tap((data:any) => {
        console.log(JSON.stringify(data));
        this.token = data.token;
        if (remember) {
          localStorage.setItem('battleships_token', this.token);
        }
      })
    );
  }

  logout() {
    console.log('Logging out');
    this.token = '';
    localStorage.setItem('battleships_token', this.token);
  }

  signup(user:any) : Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'cache-control': 'no-cache',
        'Content-Type':  'application/json',
      })
    };
    return this.http.post(this.url + '/signup', user, options).pipe(
      tap((data) => {
        console.log(JSON.stringify(data));
      })
    );
  }

  get_token() {
    return this.token;
  }

  get_username() {
    return (jwtdecode(this.token) as TokenData).username;
  }

  get_name() {
    return (jwtdecode(this.token) as TokenData).name;
  }

  get_surname() {
    return (jwtdecode(this.token) as TokenData).surname;
  }

  get_mail() {
    return (jwtdecode(this.token) as TokenData).mail;
  }

  get_id() {
    return (jwtdecode(this.token) as TokenData).id;
  }

  is_moderator() : boolean {
    let role = (jwtdecode(this.token) as TokenData).role;
    if (role === 'MODERATOR') {
      return true;
    } else {
      return false;
    }
  }
}
