import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-game-phase-two',
  templateUrl: './game-phase-two.component.html',
  styleUrls: ['./game-phase-two.component.css']
})
export class GamePhaseTwoComponent implements OnInit {

  public errmessage = undefined;
  public turn = false;
  public match_id = "";
  public match = {} as Match;
  public grid:string[] = []; // TODO
  constructor(private us: UserHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    this.load_match();
    this.sio.connect(this.match_id).subscribe((d) => {
      let arr = d.split(" ");
      if (arr[0] !== this.us.get_id() && arr[1] === "madehismove") {
        this.turn = true;
      }
    });
  }

  load_match() {
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        console.log("Match loaded");
        this.match = d;
        if (this.match.startingPlayer === this.us.get_id() && this.match.moves.length % 2 === 0) {
          this.turn = true;
        }
        if (this.match.startingPlayer !== this.us.get_id() && this.match.moves.length % 2 !== 0) {
          this.turn = true;
        }
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
