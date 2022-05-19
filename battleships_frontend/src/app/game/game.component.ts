import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

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
  public ready = false;
  public opponent_ready = false;
  public grid = new Array(10);
  public ships = {
    destroyer: ["Destroyer", "5", "2"],
    cruiser: ["Cruiser", "3", "3"],
    battleship: ["Battleship", "2", "4"],
    carrier: ["Carrier", "1", "5"]
  };
  constructor(private us: UserHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = new Array(10);
      for (let j = 0; j < this.grid[i].length; j++) {
        this.grid[i][j] = "s";
      }
    }
    this.load_match();
  }

  load_match() {
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        console.log("Match loaded");
        this.match = d;
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  post_grid() {
    let body = {grid: this.grid};
    this.m.post_grid(this.match_id, body).subscribe({
      next: (d) => {
        this.ready = true;
        if (this.opponent_ready) {
          console.log("Starting game");
          this.load_match();
        }
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    })
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
