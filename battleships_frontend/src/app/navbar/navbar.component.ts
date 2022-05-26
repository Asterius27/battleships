import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
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
    this.load_my_ongoing_matches();
  }

  load_my_ongoing_matches() {
    this.m.get_user_matches().subscribe({
      next: (d) => {
        for (let match of d) {
          if (match.result === "0-0") {
            this.sio.connect(match._id).subscribe((d) => {
              if (this.router.url != '/play') {}
            });
          }
        }
        console.log("Loaded my ongoing matches");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.logout();
      }
    });
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
