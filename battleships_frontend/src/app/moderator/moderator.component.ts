import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UsersHttpService } from '../users-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { Chat, ChatHttpService } from '../chat-http.service';
import { DOCUMENT } from '@angular/common';
import { SocketioService } from '../socketio.service';

@Component({
  selector: 'app-moderator',
  templateUrl: './moderator.component.html',
  styleUrls: ['./moderator.component.css']
})
export class ModeratorComponent implements OnInit, OnDestroy {

  public alert = "";
  public errmessage = "";
  public tabs = 1;
  public user = {username: '', password: ''};
  public delete_target = {username: ''};
  public chats:Chat[] = [];
  public usernames:{[k: string]: any} = {};
  public section = 1;
  public chat_id = "";
  public my_chat_alerts:{[k: string]: any} = {};
  public message_alert = false;
  constructor(private uss: UsersHttpService, private us: UserHttpService, private c: ChatHttpService, private router: Router, private renderer: Renderer2, @Inject(DOCUMENT) private doc: Document, private sio: SocketioService) {}

  ngOnInit(): void {
    if (!this.us.is_moderator()) {
      this.router.navigate(['/play']);
    }
    this.load_chats();
    this.sio.connect("matchinviteaccepted" + this.us.get_username()).subscribe((d) => {
      this.router.navigate(['/play/match', {match_id: d, section: "1"}]);
    });
  }

  ngOnDestroy(): void {
    this.sio.removeListener("matchinviteaccepted" + this.us.get_username());
    this.remove_chat_listeners();
  }

  load_chats() {
    this.c.get_moderator_chats(this.us.get_id()).subscribe({
      next: (d) => {
        this.remove_chat_listeners();
        this.chats = d;
        for (let chat of this.chats) {
          for (let participant of chat.participants) {
            this.load_moderators(participant, chat._id);
          }
          this.my_chat_alerts[chat._id] = false;
          this.sio.connect("newmessage" + chat._id).subscribe((d) => {
            this.my_chat_alerts[chat._id] = true;
            if (this.tabs !== 3) {
              this.message_alert = true;
            }
          });
        }
        console.log("Chats loaded");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  load_moderators(participant_id:string, chat_id:string) {
    if (!(chat_id in this.usernames) && participant_id !== this.us.get_id()) {
      this.uss.get_user_id(participant_id).subscribe({
        next: (d) => {
          this.usernames[chat_id] = d.username;
        },
        error: (err:any) => {
          console.log('Error: ' + JSON.stringify(err));
          this.errmessage = "Something went wrong, please try again";
          setTimeout(() => {this.errmessage = ""}, 3000);
        }
      });
    }
  }

  remove_chat_listeners() {
    for (let chat of this.chats) {
      this.sio.removeListener("newmessage" + chat._id);
    }
  }

  setTabs(value:number, event:any) {
    if (value === 3) {
      this.message_alert = false;
    }
    let prev = this.doc.getElementsByClassName("previous-tab");
    this.renderer.removeClass(prev[0], "active");
    this.renderer.removeClass(prev[0], "previous-tab");
    this.renderer.addClass(event.target, "active");
    this.renderer.addClass(event.target, "previous-tab");
    this.tabs = value;
    event.preventDefault();
  }

  post_moderator() {
    this.uss.post_moderator_user(this.user).subscribe({
      next: (d) => {
        this.user.username = '';
        this.user.password = '';
        this.alert = "New moderator added";
        setTimeout(() => {this.alert = "";}, 3000);
        console.log("New moderator added");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  delete_user() {
    this.uss.delete_user(this.delete_target.username).subscribe({
      next: (d) => {
        this.delete_target.username = '';
        this.alert = "User deleted";
        setTimeout(() => {this.alert = "";}, 3000);
        console.log("User deleted");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    })
  }

  open_chat(chat_id:string) {
    this.section = 2;
    this.chat_id = chat_id;
  }

  message_user(username:string) {
    this.uss.get_user_username(username).subscribe({
      next: (d) => {
        let exists = false;
        for (let chat of this.chats) {
          if (chat.participants.includes(d._id)) {
            console.log('chat already exists');
            this.section = 2;
            this.chat_id = chat._id;
            exists = true;
          }
        }
        if (!exists) {
          let body = {_id: "", participants: [d._id], messages: [], type: "moderator"};
          this.c.post_chat(body).subscribe({
            next: (ch) => {
              this.chats.push(ch);
              console.log('Routing to newly created chat');
              this.section = 2;
              this.chat_id = ch._id;
            },
            error: (err) => {
              console.log('Error: ' + JSON.stringify(err));
              this.errmessage = "Something went wrong, please try again";
              setTimeout(() => {this.errmessage = ""}, 3000);
            }
          });
        }
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  open_stats(username:string) {
    this.uss.get_user_username(username).subscribe({
      next: (d) => {
        console.log('Routing to stats');
        this.router.navigate(['/profile', {user_id: d._id, username: username}]);
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }
}
