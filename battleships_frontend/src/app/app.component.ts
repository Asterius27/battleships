import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from './user-http.service';

// TODO check backend json responses (check for leakage of sensitive data)

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'battleships_frontend';
  constructor(public router: Router, private us: UserHttpService) {}
}
