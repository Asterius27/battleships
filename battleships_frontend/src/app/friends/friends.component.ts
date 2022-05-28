import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { User, UsersHttpService } from '../users-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { Chat, ChatHttpService } from '../chat-http.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit, OnDestroy {

  public errmessage = "";
  public alert = "";
  public friends:User[] = [];
  public friend_requests:User[] = [];
  public match_invites:User[] = [];
  public moderator_chats:Chat[] = [];
  public friend_chats:Chat[] = [];
  public tabs = 1;
  public moderators:{[k: string]: any} = {};
  public section = 1;
  public chat_id = "";
  public friend_request_alert = false;
  public friend_list_alert = false;
  public match_invite_alert = false;
  public mod_message_alert = false;
  public my_moderator_chat_alerts:{[k: string]: any} = {};
  public my_friend_chat_alerts:{[k: string]: any} = {};
  constructor(private us: UserHttpService, private uss: UsersHttpService, private router: Router, private sio: SocketioService, private c: ChatHttpService, private renderer: Renderer2, @Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    this.load_my_friend_chats();
    this.load_friends_list();
    this.load_friend_requests();
    this.load_match_invites();
    this.load_moderator_chats();
    this.sio.connect("newfriendrequest" + this.us.get_username()).subscribe((d) => {
      if (this.tabs !== 2) {
        this.friend_request_alert = true;
      }
      this.load_friend_requests();
    });
    this.sio.connect("friendrequestaccepted" + this.us.get_username()).subscribe((d) => {
      if (this.tabs !== 1) {
        this.friend_list_alert = true;
      }
      this.load_friends_list();
    });
    this.sio.connect("deletedfriend" + this.us.get_username()).subscribe((d) => {
      this.load_friends_list();
      this.load_match_invites();
    });
    this.sio.connect("newmatchinvite" + this.us.get_username()).subscribe((d) => {
      if (this.tabs !== 3) {
        this.match_invite_alert = true;
      }
      this.load_match_invites();
    });
    this.sio.connect("matchinviteaccepted" + this.us.get_username()).subscribe((d) => {
      this.router.navigate(['/play/match', {match_id: d, section: "1"}]);
    });
    this.sio.connect("newchat" + this.us.get_id()).subscribe((d) => {
      if (d.type === "moderator") {
        if (this.tabs !== 4) {
          this.mod_message_alert = true;
        }
        this.load_moderator_chats();
      }
    });
  }

  ngOnDestroy(): void {
    this.sio.removeListener("newfriendrequest" + this.us.get_username());
    this.sio.removeListener("friendrequestaccepted" + this.us.get_username());
    this.sio.removeListener("deletedfriend" + this.us.get_username());
    this.sio.removeListener("newmatchinvite" + this.us.get_username());
    this.sio.removeListener("matchinviteaccepted" + this.us.get_username());
    this.sio.removeListener("newchat" + this.us.get_id());
    this.remove_my_moderator_chat_listeners();
    this.remove_my_friend_chat_listeners();
  }

  load_moderator_chats() {
    this.c.get_moderator_chats(this.us.get_id()).subscribe({
      next: (d) => {
        this.remove_my_moderator_chat_listeners();
        this.moderator_chats = d;
        for (let chat of this.moderator_chats) {
          for (let participant of chat.participants) {
            this.load_moderators(participant, chat._id);
          }
          this.my_moderator_chat_alerts[chat._id] = false;
          this.sio.connect("newmessage" + chat._id).subscribe((d) => {
            this.my_moderator_chat_alerts[chat._id] = true;
            if (this.tabs !== 4) {
              this.mod_message_alert = true;
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

  remove_my_moderator_chat_listeners() {
    for (let chat of this.moderator_chats) {
      this.sio.removeListener("newmessage" + chat._id);
    }
  }

  load_my_friend_chats() {
    this.remove_my_friend_chat_listeners();
    this.friend_chats = [];
    this.c.get_friends_chat().subscribe({
      next: (d) => {
        this.friend_chats = d;
        for (let chat of this.friend_chats) {
          for (let participant of chat.participants) {
            if (participant !== this.us.get_id()) {
              this.my_friend_chat_alerts[participant] = false;
              this.sio.connect("newmessage" + chat._id).subscribe((d) => {
                this.my_friend_chat_alerts[participant] = true;
                if (this.tabs !== 1) {
                  this.friend_list_alert = true;
                }
              });
            }
          }
        }
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
      }
    });
  }

  remove_my_friend_chat_listeners() {
    for (let chat of this.friend_chats) {
      this.sio.removeListener("newmessage" + chat._id);
    }
  }

  load_moderators(participant_id:string, chat_id:string) {
    if (!(chat_id in this.moderators) && participant_id !== this.us.get_id()) {
      this.uss.get_user_id(participant_id).subscribe({
        next: (d) => {
          if (d.role === "MODERATOR") {
            this.moderators[chat_id] = d.username;
          } else {
            this.moderators[chat_id] = "You";
          }
        },
        error: (err:any) => {
          console.log('Error: ' + JSON.stringify(err));
        }
      });
    }
  }

  load_match_invites() {
    this.match_invites = []
    this.uss.get_user_id(this.us.get_id()).subscribe({
      next: (d) => {
        for (let i = 0; i < d.match_invites.length; i++) {
          this.uss.get_user_id(d.match_invites[i]).subscribe({
            next: (u) => {
              this.match_invites.push(u);
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
    })
  }

  load_friends_list() {
    this.friends = [];
    this.uss.get_user_id(this.us.get_id()).subscribe({
      next: (d) => {
        for (let i = 0; i < d.friends_list.length; i++) {
          this.uss.get_user_id(d.friends_list[i]).subscribe({
            next: (u) => {
              this.friends.push(u);
            },
            error: (err) => {
              console.log('Error: ' + JSON.stringify(err));
              this.errmessage = "Something went wrong, please try again";
              setTimeout(() => {this.errmessage = ""}, 3000);
            }
          });
        }
        console.log('Friends list loaded');
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  load_friend_requests() {
    this.friend_requests = [];
    this.uss.get_user_id(this.us.get_id()).subscribe({
      next: (d) => {
        for (let i = 0; i < d.friend_requests.length; i++) {
          this.uss.get_user_id(d.friend_requests[i]).subscribe({
            next: (u) => {
              this.friend_requests.push(u);
            },
            error: (err) => {
              console.log('Error: ' + JSON.stringify(err));
              this.errmessage = "Something went wrong, please try again";
              setTimeout(() => {this.errmessage = ""}, 3000);
            }
          });
        }
        console.log('Friend requests loaded');
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  add_friend(username:string) {
    let body = {
      username: username,
      action: "send"
    }
    this.uss.post_friend(body).subscribe({
      next: (d) => {
        console.log('Friend added');
        this.alert = "Friend Added";
        setTimeout(() => {this.alert = "";}, 3000);
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  accept_friend(username:string) {
    let body = {
      username: username,
      action: "accept"
    }
    this.uss.post_friend(body).subscribe({
      next: (d) => {
        console.log('Friend accepted');
        this.alert = "Friend Accepted";
        setTimeout(() => {this.alert = "";}, 3000);
        this.load_friend_requests();
        this.load_friends_list();
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  reject_friend(username:string) {
    let body = {
      username: username,
      action: "reject"
    }
    this.uss.post_friend(body).subscribe({
      next: (d) => {
        console.log('Friend rejected');
        this.alert = "Friend Rejected";
        setTimeout(() => {this.alert = "";}, 3000);
        this.load_friend_requests();
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  delete_friend(username:string) {
    this.uss.delete_friend(username).subscribe({
      next: (d) => {
        console.log('Friend deleted');
        this.alert = "Friend Deleted";
        setTimeout(() => {this.alert = "";}, 3000);
        this.load_friends_list();
        this.load_match_invites();
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    })
  }

  open_chat(friend_id:string) {
    this.c.get_friend_chat(friend_id).subscribe({
      next: (d) => {
        if (d) {
          console.log('Routing to chat');
          this.section = 2;
          this.chat_id = d._id;
        } else {
          let body:Chat = {_id: "", participants: [friend_id], messages: [], type: "friend"};
          this.c.post_chat(body).subscribe({
            next: (d) => {
              console.log('Routing to newly created chat');
              this.load_my_friend_chats();
              this.section = 2;
              this.chat_id = d._id;
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

  invite_friend(username:string) {
    let body = {
      username: username,
      action: "invite"
    }
    this.uss.post_friend_match(body).subscribe({
      next: (d) => {
        console.log('Friend invited');
        this.alert = "Friend Invited";
        setTimeout(() => {this.alert = "";}, 3000);
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  accept_match_invite(username:string) {
    let body = {
      username: username,
      action: "accept"
    }
    this.uss.post_friend_match(body).subscribe({
      next: (d) => {
        console.log('Invite accepted');
        this.load_match_invites();
        this.router.navigate(['/play/match', {match_id: d.id, section: "1"}]);
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  reject_match_invite(username:string) {
    let body = {
      username: username,
      action: "reject"
    }
    this.uss.post_friend_match(body).subscribe({
      next: (d) => {
        console.log('Invite rejected');
        this.alert = "Invite rejected";
        setTimeout(() => {this.alert = "";}, 3000);
        this.load_match_invites();
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  open_moderator_chat(chat_id:string) {
    console.log('Routing to chat');
    this.section = 2;
    this.chat_id = chat_id;
  }

  open_stats(friend_id:string, friend_username:string) {
    console.log('Routing to stats');
    this.router.navigate(['/profile', {user_id: friend_id, username: friend_username}]);
  }

  setTabs(value:number, event:any) {
    if (value === 1) {
      this.friend_list_alert = false;
    }
    if (value === 2) {
      this.friend_request_alert = false;
    }
    if (value === 3) {
      this.match_invite_alert = false;
    }
    if (value === 4) {
      this.mod_message_alert = false;
    }
    let prev = this.doc.getElementsByClassName("previous-tab");
    this.renderer.removeClass(prev[0], "active");
    this.renderer.removeClass(prev[0], "previous-tab");
    this.renderer.addClass(event.target, "active");
    this.renderer.addClass(event.target, "previous-tab");
    this.tabs = value;
    event.preventDefault();
  }
}
