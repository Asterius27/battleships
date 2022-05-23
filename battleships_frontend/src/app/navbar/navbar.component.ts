import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  public moderator:boolean = false;
  constructor(private us: UserHttpService, private router: Router) {}

  ngOnInit(): void {
    if (this.us.is_moderator()) {
      this.moderator = true;
    }
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
