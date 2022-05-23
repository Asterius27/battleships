import { Component, OnInit } from '@angular/core';
import { UsersHttpService } from '../users-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { Chat, ChatHttpService } from '../chat-http.service';

@Component({
  selector: 'app-moderator',
  templateUrl: './moderator.component.html',
  styleUrls: ['./moderator.component.css']
})
export class ModeratorComponent implements OnInit {

  public errmessage = undefined;
  public tabs = 1;
  public user = {username: '', password: ''};
  public delete_target = {username: ''};
  public chats:Chat[] = [];
  constructor(private uss: UsersHttpService, private us: UserHttpService, private c: ChatHttpService, private router: Router) {}

  ngOnInit(): void {
    this.load_chats();
  }

  load_chats() {
    this.c.get_moderator_chats(this.us.get_id()).subscribe({
      next: (d) => {
        this.chats = d;
        console.log("Chats loaded");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  setTabs(tab:number) {
    this.tabs = tab;
  }

  post_moderator() {
    this.uss.post_moderator_user(this.user).subscribe({
      next: (d) => {
        console.log("New moderator added");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  delete_user() {
    this.uss.delete_user(this.delete_target.username).subscribe({
      next: (d) => {
        console.log("User deleted");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    })
  }

  open_chat(chat_id:string) {
    this.router.navigate(['/chat', {chat_id: chat_id}]);
  }

  message_user(username:string) {
    this.uss.get_user_username(username).subscribe({
      next: (d) => {
        let exists = false;
        for (let chat of this.chats) {
          if (chat.participants.includes(d._id)) {
            console.log('chat already exists');
            this.router.navigate(['/chat', {chat_id: chat._id}]);
            exists = true;
          }
        }
        if (!exists) {
          let body = {_id: "", participants: [d._id], messages: [], type: "moderator"};
          this.c.post_chat(body).subscribe({
            next: (ch) => {
              this.chats.push(ch);
              console.log('Routing to newly created chat');
              this.router.navigate(['/chat', {chat_id: ch._id}]);
            },
            error: (err) => {
              console.log('Login error: ' + JSON.stringify(err));
              this.errmessage = err.message;
              this.logout();
            }
          });
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
