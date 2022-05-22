import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-game-observe',
  templateUrl: './game-observe.component.html',
  styleUrls: ['./game-observe.component.css']
})
export class GameObserveComponent implements OnInit {

  public gridPlayerOne:string[] = [];
  public gridPlayerTwo:string[] = [];
  public match_id = "";
  public errmessage = undefined;
  public match = {} as Match;
  constructor(private us: UserHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    this.load_match();
    this.sio.connect(this.match_id).subscribe((d) => {
      let arr = d.split(" ");
      if (arr[0] === "matchisfinished") {
        // navigate to post game
      }
      this.load_match();
    });
  }

  load_match() {
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        console.log("Match loaded");
        this.match = d;
        this.load_linear_grid_player_one();
        this.load_linear_grid_player_two();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  load_linear_grid_player_one() {
    this.gridPlayerOne = new Array(100);
    for (let i = 0; i < this.match.gridOne.length; i++) {
      for (let j = 0; j < this.match.gridOne[i].length; j++) {
        this.gridPlayerOne[(i * 10) + j] = this.match.gridOne[i][j];
      }
    }
  }

  load_linear_grid_player_two() {
    this.gridPlayerTwo = new Array(100);
    for (let i = 0; i < this.match.gridTwo.length; i++) {
      for (let j = 0; j < this.match.gridTwo[i].length; j++) {
        this.gridPlayerTwo[(i * 10) + j] = this.match.gridTwo[i][j];
      }
    }
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
