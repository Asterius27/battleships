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
  constructor(private us: UserHttpService, private m: MatchHttpService, private sio: SocketioService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('match_id') || "";
    this.load_match();
  }

  load_match() {
    this.m.get_match(this.match_id).subscribe({
      next: (d) => {
        this.match = d;
        
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
