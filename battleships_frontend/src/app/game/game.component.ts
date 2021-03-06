import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  public errmessage = "";
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
        if ((this.section === 1 || this.section === 2) && (this.match.playerOne !== this.us.get_id() && this.match.playerTwo !== this.us.get_id())) {
          this.router.navigate(['/play']);
        }
        // console.log("Match loaded");
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  setSection(s:number) {
    this.section = s;
  }
}
