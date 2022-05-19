import { Component, OnInit } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { Match, MatchHttpService } from '../match-http.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {

  public errmessage = undefined;
  public my_ongoing_matches:Match[] = [];
  constructor(private us: UserHttpService, private router: Router, private sio: SocketioService, private m: MatchHttpService) {}

  ngOnInit(): void {
    this.load_my_matches();
  }

  load_my_matches() {
    this.my_ongoing_matches = [];
    this.m.get_user_matches().subscribe({
      next: (d) => {
        for (let match of d) {
          if (match.result === "0-0") {
            this.my_ongoing_matches.push(match);
          }
        }
        console.log("Loaded my ongoing matches");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  open_match(match_id:string) {
    this.router.navigate(['/play/match', {match_id: match_id}]);
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
