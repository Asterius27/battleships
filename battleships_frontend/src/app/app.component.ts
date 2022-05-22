import { Component } from '@angular/core';
import { Router } from '@angular/router';

// TODO move global sio connect here so that they are application wide

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'battleships_frontend';
  constructor(public router: Router) {}
}
