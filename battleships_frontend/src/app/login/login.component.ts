import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public errmessage = undefined;
  constructor(private router: Router) {}

  ngOnInit(): void {}

  login( mail: string, password: string, remember: boolean ) {
    /*
    this.us.login(mail, password, remember).subscribe((d) => {
      console.log('Login granted: ' + JSON.stringify(d));
      console.log('User service token: ' + this.us.get_token());
      this.errmessage = undefined;
      this.router.navigate(['/messages']);
    }, (err) => {
      console.log('Login error: ' + JSON.stringify(err) );
      this.errmessage = err.message;
    });
    */
  }
}
