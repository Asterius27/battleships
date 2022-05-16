import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  public errmessage = undefined;
  public user = {username: '', name: '', surname: '', mail: '', password: ''};

  constructor(private us: UserHttpService, private router: Router) { }

  ngOnInit(): void {}

  signup() {
    this.us.signup(this.user).subscribe({
      next: (d) => {
        console.log('Registration ok: ' + JSON.stringify(d));
        this.errmessage = undefined;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log('Signup error: ' + JSON.stringify(err.error.errormessage));
        this.errmessage = err.error.errormessage || err.error.message;
      }
    });
  }

}
