import { Component, OnInit } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { User, UsersHttpService } from '../users-http.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit {

  public errmessage = undefined;
  public friends:User[] = [];
  public friend_requests:User[] = [];
  public tabs = true;
  constructor(private us: UserHttpService, private uss: UsersHttpService) {}

  ngOnInit(): void {
    this.load_friends_list();
    this.load_friend_requests();
  }

  load_friends_list() {
    this.uss.get_user_id(this.us.get_id()).subscribe({
      next: (d) => {
        for (let i = 0; i < d.friends_list.length; i++) {
          this.uss.get_user_id(d.friends_list[i]).subscribe({
            next: (u) => {
              this.friends.push(u);
            },
            error: (err) => {
              console.log('Login error: ' + JSON.stringify(err));
              this.errmessage = err.message;
            }
          });
        }
        console.log('Friends list loaded');
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
      }
    });
  }

  load_friend_requests() {
    this.uss.get_user_id(this.us.get_id()).subscribe({
      next: (d) => {
        for (let i = 0; i < d.friend_requests.length; i++) {
          this.uss.get_user_id(d.friend_requests[i]).subscribe({
            next: (u) => {
              this.friend_requests.push(u);
            },
            error: (err) => {
              console.log('Login error: ' + JSON.stringify(err));
              this.errmessage = err.message;
            }
          });
        }
        console.log('Friend requests loaded');
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
      }
    });
  }

  setTabs(value:boolean) {
    this.tabs = value;
  }
}
