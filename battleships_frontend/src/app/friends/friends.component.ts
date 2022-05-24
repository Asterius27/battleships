import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
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
export class FriendsComponent implements OnInit {

  public errmessage = undefined;
  public notification = "";
  public friends:User[] = [];
  public friend_requests:User[] = [];
  public match_invites:User[] = [];
  public moderator_chats:Chat[] = [];
  public tabs = 1;
  constructor(private us: UserHttpService, private uss: UsersHttpService, private router: Router, private sio: SocketioService, private c: ChatHttpService, private renderer: Renderer2, @Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    this.load_friends_list();
    this.load_friend_requests();
    this.load_match_invites();
    this.load_moderator_chats();
    this.sio.connect("newfriendrequest" + this.us.get_username()).subscribe((d) => {
      this.load_friend_requests();
    });
    this.sio.connect("friendrequestaccepted" + this.us.get_username()).subscribe((d) => {
      this.load_friends_list();
    });
    this.sio.connect("deletedfriend" + this.us.get_username()).subscribe((d) => {
      this.load_friends_list();
    });
    this.sio.connect("newmatchinvite" + this.us.get_username()).subscribe((d) => {
      this.load_match_invites();
    });
    this.sio.connect("matchinviteaccepted" + this.us.get_username()).subscribe((d) => {
      this.router.navigate(['/play/match', {match_id: d, section: "1"}]);
    });
    this.sio.connect("newchat" + this.us.get_id()).subscribe((d) => {
      if (d.type === "moderator") {
        this.load_moderator_chats();
      }
    });
  }

  load_moderator_chats() {
    this.c.get_moderator_chats(this.us.get_id()).subscribe({
      next: (d) => {
        this.moderator_chats = d;
        console.log("Chats loaded");
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
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
              console.log('Login error: ' + JSON.stringify(err));
              this.errmessage = err.message;
              this.logout();
            }
          });
        }
        console.log('Friends list loaded');
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
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
              console.log('Login error: ' + JSON.stringify(err));
              this.errmessage = err.message;
              this.logout();
            }
          });
        }
        console.log('Friend requests loaded');
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
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
        this.notification = "Friend Added";
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
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
        this.notification = "Friend Accepted";
        this.load_friend_requests();
        this.load_friends_list();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
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
        this.notification = "Friend Rejected";
        this.load_friend_requests();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  delete_friend(username:string) {
    this.uss.delete_friend(username).subscribe({
      next: (d) => {
        console.log('Friend deleted');
        this.notification = "Friend Deleted";
        this.load_friends_list();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    })
  }

  open_chat(friend_id:string) {
    this.c.get_friend_chat(friend_id).subscribe({
      next: (d) => {
        if (d) {
          console.log('Routing to chat');
          this.router.navigate(['/chat', {chat_id: d._id}]);
        } else {
          let body:Chat = {_id: "", participants: [friend_id], messages: [], type: "friend"};
          this.c.post_chat(body).subscribe({
            next: (d) => {
              console.log('Routing to newly created chat');
              this.router.navigate(['/chat', {chat_id: d._id}]);
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

  invite_friend(username:string) {
    let body = {
      username: username,
      action: "invite"
    }
    this.uss.post_friend_match(body).subscribe({
      next: (d) => {
        console.log('Friend invited');
        this.notification = "Friend Invited";
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
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
        this.notification = "Invite Accepted";
        this.load_match_invites();
        this.router.navigate(['/play/match', {match_id: d.id, section: "1"}]);
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
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
        this.notification = "Invite rejected";
        this.load_match_invites();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  open_moderator_chat(chat_id:string) {
    console.log('Routing to chat');
    this.router.navigate(['/chat', {chat_id: chat_id}]);
  }

  open_stats(friend_id:string, friend_username:string) {
    console.log('Routing to stats');
    this.router.navigate(['/profile', {user_id: friend_id, username: friend_username}]);
  }

  setTabs(value:number, event:any) {
    let prev = this.doc.getElementsByClassName("previous-tab");
    this.renderer.removeClass(prev[0], "active");
    this.renderer.removeClass(prev[0], "previous-tab");
    this.renderer.addClass(event.target, "active");
    this.renderer.addClass(event.target, "previous-tab");
    this.tabs = value;
    event.preventDefault();
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
