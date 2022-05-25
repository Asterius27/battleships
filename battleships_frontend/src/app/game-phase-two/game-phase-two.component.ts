import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, Renderer2 } from '@angular/core';
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

  @Output() sectionChange = new EventEmitter<number>();
  public errmessage = undefined;
  public turn = false;
  @Input() match_id = "";
  public match = {} as Match;
  public grid:string[] = [];
  public opponent_grid:string[] = [];
  public move:number = 100;
  public display:string = "none";
  public user_id = "";
  public result = "";
  constructor(private us: UserHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router, private renderer: Renderer2, @Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    if (this.match_id === "") {
      this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    }
    this.load_match();
    this.sio.connect(this.match_id).subscribe((d) => {
      let arr = d.split(" ");
      if (arr[0] !== this.us.get_id() && arr[1] === "madehismove") {
        this.turn = true;
        this.load_match();
      }
      if (arr[0] === "matchisfinished") {
        if ((this.match.playerOne === this.us.get_id() && arr[1] === "1-0") || (this.match.playerTwo === this.us.get_id() && arr[1] === "0-1")) {
          this.result = "won!";
          console.log("You have won!");
        }
        if ((this.match.playerOne === this.us.get_id() && arr[1] === "0-1") || (this.match.playerTwo === this.us.get_id() && arr[1] === "1-0")) {
          this.result = "lost";
          console.log("You have lost!");
        }
        this.doc.getElementById("post-game")?.click();
      }
    });
  }

  load_match() {
    this.user_id = this.us.get_id();
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        console.log("Match loaded");
        this.match = d;
        if (this.match.playerOne !== this.us.get_id() && this.match.playerTwo !== this.us.get_id()) {
          this.sectionChange.emit(3);
          // this.router.navigate(['/play/match/observe', {match_id: this.match_id}]);
        }
        if (this.match.result !== "0-0") {
          this.doc.getElementById("post-game")?.click();
        }
        if (this.match.startingPlayer === this.us.get_id() && this.match.moves.length % 2 === 0) {
          this.turn = true;
        }
        if (this.match.startingPlayer !== this.us.get_id() && this.match.moves.length % 2 !== 0) {
          this.turn = true;
        }
        this.load_linear_grid();
        this.load_linear_grid_opponent();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  load_linear_grid() {
    this.grid = new Array(100);
    if (this.match.playerOne === this.us.get_id()) {
      for (let i = 0; i < this.match.gridOne.length; i++) {
        for (let j = 0; j < this.match.gridOne[i].length; j++) {
          this.grid[(i * 10) + j] = this.match.gridOne[i][j];
        }
      }
    }
    if (this.match.playerTwo === this.us.get_id()) {
      for (let i = 0; i < this.match.gridTwo.length; i++) {
        for (let j = 0; j < this.match.gridTwo[i].length; j++) {
          this.grid[(i * 10) + j] = this.match.gridTwo[i][j];
        }
      }
    }
  }

  load_linear_grid_opponent() {
    this.opponent_grid = new Array(100);
    if (this.match.playerOne !== this.us.get_id()) {
      for (let i = 0; i < this.match.gridOne.length; i++) {
        for (let j = 0; j < this.match.gridOne[i].length; j++) {
          this.opponent_grid[(i * 10) + j] = this.match.gridOne[i][j];
        }
      }
    }
    if (this.match.playerTwo !== this.us.get_id()) {
      for (let i = 0; i < this.match.gridTwo.length; i++) {
        for (let j = 0; j < this.match.gridTwo[i].length; j++) {
          this.opponent_grid[(i * 10) + j] = this.match.gridTwo[i][j];
        }
      }
    }
  }

  setMove(event:any) {
    if (this.opponent_grid[event.target.id] === 'b' || this.opponent_grid[event.target.id] === 's') {
      if (this.move !== 100) {
        this.renderer.removeClass(this.doc.getElementById(String(this.move)), "selected");
      }
      this.move = event.target.id;
      this.renderer.addClass(event.target, "selected");
    }
  }

  post_move() {
    if (this.move !== 100) {
      let body = {move: this.get_parsed_move()};
      this.turn = false;
      this.renderer.removeClass(this.doc.getElementById(String(this.move)), "selected");
      this.move = 100;
      this.m.post_move(this.match_id, body).subscribe({
        next: (d) => {
          this.match = d;
          this.load_linear_grid();
          this.load_linear_grid_opponent();
          console.log("Move posted");
        },
        error: (err) => {
          console.log('Login error: ' + JSON.stringify(err));
          this.errmessage = err.message;
          this.logout();
        }
      });
    }
  }

  close_game() {
    this.router.navigate(['/play']);
  }

  open_modal() {
    this.display = "block";
  }

  get_parsed_move(): string {
    let letter = "";
    let lett = (this.move % 10);
    let num = Math.floor(this.move / 10) + 1;
    switch (lett) {
      case 0:
        letter = 'A';
        break;
      case 1:
        letter = 'B';
        break;
      case 2:
        letter = 'C';
        break;
      case 3:
        letter = 'D';
        break;
      case 4:
        letter = 'E';
        break;
      case 5:
        letter = 'F';
        break;
      case 6:
        letter = 'G';
        break;
      case 7:
        letter = 'H';
        break;
      case 8:
        letter = 'I';
        break;
      case 9:
        letter = 'J';
        break;
      default:
        console.log("Parse move error");
    }
    return letter + num;
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
