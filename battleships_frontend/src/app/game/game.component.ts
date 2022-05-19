import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match, MatchHttpService } from '../match-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';
import interact from 'interactjs';

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
  public direction = true;
  public grid:string[] = new Array(100);
  public drop:boolean = false;
  public ships = [
    ["Destroyer", "2"],
    ["Destroyer", "2"],
    ["Destroyer", "2"],
    ["Destroyer", "2"],
    ["Destroyer", "2"],
    ["Cruiser", "3"],
    ["Cruiser", "3"],
    ["Cruiser", "3"],
    ["Battleship", "4"],
    ["Battleship", "4"],
    ["Carrier", "1", "5"]
  ];
  constructor(private us: UserHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = "s";
    }
    this.load_match();
    interact('.dropzone').dropzone({
      overlap: 0.75,
      ondropactivate: (event) => {
        this.drop = false;
        this.renderer.removeClass(event.target, 'dropzone');
        this.renderer.addClass(event.target, 'drop-active');
      },
      ondragenter: (event) => {
        this.drop = true;
        this.renderer.addClass(event.target, 'drop-target');
      },
      ondragleave: (event) => {
        this.drop = false;
        this.renderer.removeClass(event.target, 'drop-target');
      },
      ondrop: (event) => {
        console.log("Dropped ship at: " + event.target.id);
        if (this.cellIsAvailable(event.relatedTarget.id, event.target.id)) {
          console.log("Cell available true");
          this.update_grid(event.relatedTarget.id, event.target.id);
        } else {
          console.log("Cell available false");
          event.relatedTarget.removeAttribute('data-x');
          event.relatedTarget.removeAttribute('data-y');
          event.relatedTarget.style.transform = 'translate(0px, 0px)';
        }
      },
      ondropdeactivate: (event) => {
        this.renderer.removeClass(event.target, 'drop-active');
        this.renderer.addClass(event.target, 'dropzone');
        this.renderer.removeClass(event.target, 'drop-target');
        if (!this.drop) {
          console.log("Item should now reset");
          event.relatedTarget.removeAttribute('data-x');
          event.relatedTarget.removeAttribute('data-y');
          event.relatedTarget.style.transform = 'translate(0px, 0px)';
        }
      }
    });
    interact('.drop').draggable({
      inertia: true,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent', 
          endOnly: true
        })
      ],
      autoScroll: true,
      listeners: {
        move: this.dragMoveListener
      }
    });
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

  dragMoveListener(event:any) {
    var target = event.target
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
  }

  // TODO check it
  update_grid(boat_id:any, cell_id:any) {
    let length = parseInt(this.ships[boat_id][1]);
    if (this.direction) {
      this.grid[cell_id - 1] = "f";
      for (let i = 0; i < length; i++) {
        this.grid[cell_id + i] = "b";
        this.grid[(cell_id + i) + 10] = "f";
        this.grid[(cell_id + i) - 10] = "f";
      }
      this.grid[length] = "f";
    } else {
      this.grid[cell_id + 10] = "f";
      for (let i = 0; i < length; i++) {
        this.grid[cell_id - (i * 10)] = "b";
        this.grid[(cell_id - (i * 10)) + 1] = "f";
        this.grid[(cell_id - (i * 10)) - 1] = "f";
      }
      this.grid[cell_id - (length * 10)] = "f";
    }
  }

  checkNeighbour(position:number, direction:string, check:string) : boolean {
    if (direction === 'n') {
      if (position - 10 < 0) {
        return true;
      } else {
        if (this.grid[position - 10] === check) {
          return false;
        } else {
          return true;
        }
      }
    }
    if (direction === 's') {
      if (position + 10 > this.grid.length - 1) {
        return true;
      } else {
        if (this.grid[position + 10] === check) {
          return false;
        } else {
          return true;
        }
      }
    }
    if (direction === 'e') {
      if (position + 1 > this.grid.length - 1 || Math.floor(position / 10) !== Math.floor((position + 1) / 10)) {
        return true;
      } else {
        if (this.grid[position + 1] === check) {
          return false;
        } else {
          return true;
        }
      }
    }
    if (direction === 'w') {
      if (position - 1 < 0 || Math.floor(position / 10) !== Math.floor((position - 1) / 10)) {
        return true;
      } else {
        if (this.grid[position - 1] === check) {
          return false;
        } else {
          return true;
        }
      }
    }
    return false;
  }

  cellIsAvailable(boat_id:any, cell:any) : boolean {
    let length = parseInt(this.ships[boat_id][1]);
    let cell_id = parseInt(cell);
    console.log("position: " + cell_id + " boat length: " + length);
    if (this.direction) {
      if (cell_id + (length - 1) > this.grid.length - 1 || ((cell_id + (length - 1)) % 10 <= cell_id % 10)) {
        return false;
      }
    } else {
      if (cell_id - (length * 10) < 0) {
        return false;
      }
    }
    if (this.grid[cell_id] === 'b' || this.grid[cell_id] === 'f') {
      return false;
    } else {
      if (this.direction) {
        if (!this.checkNeighbour(cell_id, 'w', 'b')){
          return false;
        }
        for (let i = 0; i < length - 1; i++) {
          let temp = cell_id + i;
          if (!(this.checkNeighbour(temp, 'e', 'b') && this.checkNeighbour(temp, 'e', 'f') && this.checkNeighbour(temp, 'n', 'b') && this.checkNeighbour(temp, 's', 'b'))) {
            return false;
          }
        }
        if (!(this.checkNeighbour(cell_id + (length - 1), 'e', 'b') && this.checkNeighbour(cell_id + (length - 1), 'n', 'b') && this.checkNeighbour(cell_id + (length - 1), 's', 'b'))) {
          return false;
        }
        return true;
      } else {
        if (!this.checkNeighbour(cell_id, 's', 'b')){
          return false;
        }
        for (let i = 0; i < length - 1; i++) {
          let temp = cell_id - (i * 10);
          if (!(this.checkNeighbour(temp, 'n', 'b') && this.checkNeighbour(temp, 'n', 'f') && this.checkNeighbour(temp, 'e', 'b') && this.checkNeighbour(temp, 'w', 'b'))) {
            return false;
          }
        }
        if (!(this.checkNeighbour(cell_id - ((length - 1) * 10), 'n', 'b') && this.checkNeighbour(cell_id - ((length - 1) * 10), 'e', 'b') && this.checkNeighbour(cell_id - ((length - 1) * 10), 'w', 'b'))) {
          return false;
        }
        return true;
      }
    }
  }

  changeBoatDirection(event:any) {
    this.direction = !this.direction;
    console.log("Changed boat direction " + this.direction);
    event.preventDefault();
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
