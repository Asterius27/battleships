import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import jwtdecode from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

interface TokenData {
  username: string,
  name: string,
  surname: string,
  mail: string,
  role: string,
  id: string,
  temporary: boolean,
  exp: number
}

@Injectable({
  providedIn: 'root'
})
export class UserHttpService {

  private token = '';
  public url = environment.backend_url;

  constructor(private http: HttpClient, private router: Router) {
    console.log('User service instantiated');
    if (!localStorage.getItem('battleships_token')) {
      console.log("No token found in local storage");
      this.token = "";
      this.router.navigate(['/login']);
    } else {
      this.token = localStorage.getItem('battleships_token') || "";
      console.log("JWT loaded from local storage: " + this.token);
      if (!(Date.now() >= this.get_exp() * 1000)) {
        console.log("Already logged in");
        if (this.get_temporary() === true) {
          this.router.navigate(['/profile/edit']);
        }
      }
      if (Date.now() >= this.get_exp() * 1000) {
        console.log("Token has expired");
        this.router.navigate(['/login']);
      }
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
    localStorage.setItem('battleships_token', "");
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

  get_temporary() {
    return (jwtdecode(this.token) as TokenData).temporary;
  }

  get_exp() {
    return (jwtdecode(this.token) as TokenData).exp;
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
