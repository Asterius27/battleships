import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatchHttpService } from '../match-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  public moderator:boolean = false;
  public play_notification:boolean = false;
  public friends_notification:boolean = false;
  constructor(private us: UserHttpService, private sio: SocketioService, private router: Router, private m: MatchHttpService) {}

  ngOnInit(): void {
    if (this.us.is_moderator()) {
      this.moderator = true;
    }
  }

  load(link:string, event:any) {
    event.preventDefault();
    this.router.navigateByUrl('/play', {skipLocationChange: true}).then(() => {
      this.router.navigate([link]);
    });
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
