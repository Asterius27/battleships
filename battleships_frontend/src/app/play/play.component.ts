import { Component, OnInit, Renderer2 } from '@angular/core';
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
  public match_making_button = "Find Match";
  public my_ongoing_matches:Match[] = [];
  public ongoing_matches:Match[] = [];
  public tabs = 1;
  constructor(private us: UserHttpService, private router: Router, private sio: SocketioService, private m: MatchHttpService, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.load_my_matches();
    this.load_ongoing_matches();
    this.sio.connect("newmatch").subscribe((d) => {
      if (d.playerOne === this.us.get_id() || d.playerTwo === this.us.get_id()) {
        this.open_match(d);
      }
      this.load_my_matches();
      this.load_ongoing_matches();
    });
  }

  load_ongoing_matches() {
    this.ongoing_matches = [];
    this.m.get_ongoing_matches().subscribe({
      next: (d) => {
        this.ongoing_matches = d;
        console.log("Loaded ongoing matches");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
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

  open_match(match:Match) {
    if (match.gridOne[0].length !== 0 && match.gridTwo[0].length !== 0) {
      this.router.navigate(['/play/match', {match_id: match._id, section: "2"}]);
    } else {
      this.router.navigate(['/play/match', {match_id: match._id, section: "1"}]);
    }
  }

  match_making(event:any) {
    if (this.match_making_button === "Find Match") {
      this.m.post_queue().subscribe({
        next: (d) => {
          this.match_making_button = "Cancel";
          this.renderer.removeClass(event.target, "btn-success");
          this.renderer.addClass(event.target, "btn-danger");
          console.log("Player queued");
        },
        error: (err) => {
          console.log('Login error: ' + JSON.stringify(err));
          this.errmessage = err.message;
          this.logout();
        }
      })
    } else {
      if (this.match_making_button === "Cancel") {
        this.m.delete_queue().subscribe({
          next: (d) => {
            this.match_making_button = "Find Match";
            this.renderer.removeClass(event.target, "btn-danger");
            this.renderer.addClass(event.target, "btn-success");
            console.log("Player removed from queued");
          },
          error: (err) => {
            console.log('Login error: ' + JSON.stringify(err));
            this.errmessage = err.message;
            this.logout();
          }
        });
      }
    }
  }

  observe_match(match:Match) {
    this.router.navigate(['/play/match', {match_id: match._id, section: "3"}]);
  }

  setTabs(value:number) {
    this.tabs = value;
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
