import { DOCUMENT } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';
import { UsersHttpService } from '../users-http.service';

@Component({
  selector: 'app-game-observe',
  templateUrl: './game-observe.component.html',
  styleUrls: ['./game-observe.component.css']
})
export class GameObserveComponent implements OnInit, OnDestroy {

  public gridPlayerOne:string[] = [];
  public gridPlayerTwo:string[] = [];
  public playerOne:string = "";
  public playerTwo:string = "";
  @Input() match_id = "";
  public errmessage = "";
  public match = {} as Match;
  public display:string = "none";
  constructor(private us: UserHttpService, private uss: UsersHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router, @Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    if (this.match_id === "") {
      this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    }
    this.load_match();
    this.sio.connect(this.match_id).subscribe((d) => {
      let arr = d.split(" ");
      if (arr[0] === "matchisfinished") {
        this.doc.getElementById("post-game")?.click();
      }
      this.load_match();
    });
  }

  ngOnDestroy(): void {
    this.sio.removeListener(this.match_id);
  }

  load_match() {
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        // console.log("Match loaded");
        this.match = d;
        if (d.result === "0-0") {
          this.load_linear_grid_player_one();
          this.load_linear_grid_player_two();
          this.get_players_username();
        } else {
          this.get_players_username();
          this.doc.getElementById("post-game")?.click();
        }
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
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
    if (this.match.gridOne.length === 1) {
      this.gridPlayerOne = Array(100).fill('s');
    }
  }

  load_linear_grid_player_two() {
    this.gridPlayerTwo = new Array(100);
    for (let i = 0; i < this.match.gridTwo.length; i++) {
      for (let j = 0; j < this.match.gridTwo[i].length; j++) {
        this.gridPlayerTwo[(i * 10) + j] = this.match.gridTwo[i][j];
      }
    }
    if (this.match.gridTwo.length === 1) {
      this.gridPlayerTwo = Array(100).fill('s');
    }
  }

  get_players_username() {
    this.uss.get_user_id(this.match.playerOne).subscribe({
      next: (d) => {
        this.playerOne = d.username;
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
      }
    });
    this.uss.get_user_id(this.match.playerTwo).subscribe({
      next: (d) => {
        this.playerTwo = d.username;
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
      }
    });
  }

  close_game() {
    this.router.navigate(['/play']);
  }

  open_modal() {
    this.display = "block";
  }
}
