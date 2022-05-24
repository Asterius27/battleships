import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { Match, MatchHttpService } from '../match-http.service';
import { DOCUMENT } from '@angular/common';
import { UsersHttpService } from '../users-http.service';

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
  public match_range = 50;
  public win_range = 25;
  public flag = true;
  public timeout:null|ReturnType<typeof setTimeout> = null;
  public usernames:{[k: string]: any} = {};
  constructor(private us: UserHttpService, private uss: UsersHttpService, private router: Router, private sio: SocketioService, private m: MatchHttpService, private renderer: Renderer2, @Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    this.load_my_matches();
    this.load_ongoing_matches();
    this.sio.connect("newmatch").subscribe((d) => {
      if (d.playerOne === this.us.get_id() || d.playerTwo === this.us.get_id()) {
        if (this.timeout !== null) {
          clearTimeout(this.timeout);
        }
        this.flag = false;
        this.match_range = 50;
        this.win_range = 25;
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
        for (let m of this.ongoing_matches) {
          this.load_usernames(m.playerOne);
          this.load_usernames(m.playerTwo);
        }
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
            this.load_usernames(match.playerOne);
            this.load_usernames(match.playerTwo);
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
      this.m.post_queue(this.match_range, this.win_range).subscribe({
        next: (d) => {
          this.match_making_button = "Cancel";
          this.renderer.removeClass(event.target, "btn-success");
          this.renderer.addClass(event.target, "btn-danger");
          if (this.flag) {
            let self = this;
            this.timeout = setTimeout(this.match_making_callback, 5000, self);
          }
          console.log("Player queued");
        },
        error: (err) => {
          console.log('Login error: ' + JSON.stringify(err));
          this.errmessage = err.message;
          this.logout();
        }
      });
    } else {
      if (this.match_making_button === "Cancel") {
        this.m.delete_queue().subscribe({
          next: (d) => {
            this.match_making_button = "Find Match";
            this.renderer.removeClass(event.target, "btn-danger");
            this.renderer.addClass(event.target, "btn-success");
            if (this.timeout !== null) {
              clearTimeout(this.timeout);
            }
            this.match_range = 50;
            this.win_range = 25;
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

  match_making_callback(self:any) {
    self.win_range = self.win_range * 2;
    self.match_range = self.match_range * 2;
    self.m.post_queue(self.match_range, self.win_range).subscribe({
      next: (d:any) => {
        if (self.flag) {
          self.timeout = setTimeout(self.match_making_callback, 5000, self);
        }
        console.log("Widened the search");
      },
      error: (err:any) => {
        console.log('Login error: ' + JSON.stringify(err));
        self.errmessage = err.message;
        self.logout();
      }
    });
  }

  observe_match(match:Match) {
    this.router.navigate(['/play/match', {match_id: match._id, section: "3"}]);
  }

  load_usernames(id:string) {
    if (!(id in this.usernames)) {
      this.uss.get_user_id(id).subscribe({
        next: (d) => {
          this.usernames[id] = d.username;
        },
        error: (err:any) => {
          console.log('Login error: ' + JSON.stringify(err));
          this.errmessage = err.message;
          this.logout();
        }
      });
    }
  }

  setTabs(value:number, event:any) {
    let prev = this.doc.getElementsByClassName("previous-tab");
    this.renderer.removeClass(prev[0], "active");
    this.renderer.removeClass(prev[0], "previous-tab");
    this.renderer.addClass(event.target, "active");
    this.renderer.addClass(event.target, "previous-tab");
    this.tabs = value;
    event.preventDefault();
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
