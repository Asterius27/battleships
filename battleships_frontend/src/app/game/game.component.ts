import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { UserHttpService } from '../user-http.service';

// TODO make it nicer

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  public errmessage = undefined;
  public notification = "";
  public match = {} as Match;
  public match_id = "";
  public section = 1;
  public participant_id = "";
  constructor(private us: UserHttpService, private m: MatchHttpService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    this.section = parseInt(this.route.snapshot.paramMap.get('section') || "1");
    if (this.section === 3) {
      this.participant_id = this.us.get_id();
    }
    this.load_match();
  }

  load_match() {
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        this.match = d;
        console.log("Match loaded");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  setSection(s:number) {
    this.section = s;
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
