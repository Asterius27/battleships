import { Component } from '@angular/core';
import { Router } from '@angular/router';

// TODO notifications on navbar, notification for new message in friend chat, notification for something happened in one of your games

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'battleships_frontend';
  constructor(public router: Router) {}
}
