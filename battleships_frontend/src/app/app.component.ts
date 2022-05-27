import { Component } from '@angular/core';
import { Router } from '@angular/router';

// TODO notifications on navbar (use it also to make notifications persistent)

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'battleships_frontend';
  constructor(public router: Router) {}
}
