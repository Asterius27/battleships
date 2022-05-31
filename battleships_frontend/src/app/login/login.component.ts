import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public errmessage = "";
  constructor(private us: UserHttpService, private router: Router) {}

  ngOnInit(): void {
    if (localStorage.getItem('battleships_token') && !(Date.now() >= this.us.get_exp() * 1000)) {
      this.router.navigate(['/play']);
    }
  }

  login(username: string, password: string, remember: boolean) {
    this.us.login(username, password, remember).subscribe({
      next: (d) => {
        // console.log('Login granted: ' + JSON.stringify(d));
        // console.log('User service token: ' + this.us.get_token());
        if (d.temporary) {
          this.router.navigate(['/profile/edit']);
        } else {
          this.router.navigate(['/play']);
        }
      },
      error: (err) => {
        // console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = "Invalid username or password";
        setTimeout(() => {this.errmessage = "";}, 3000);
      }
    });
  }
}
