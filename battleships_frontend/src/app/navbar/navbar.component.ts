import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, Event, RouterEvent } from '@angular/router';
import { ChatHttpService } from '../chat-http.service';
import { MatchHttpService } from '../match-http.service';
import { NotificationHttpService } from '../notification-http.service';
import { SocketioService } from '../socketio.service';
import { UserHttpService } from '../user-http.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

  public moderator:boolean = false;
  public play_alert:boolean = false;
  public friends_alert:boolean = false;
  public moderator_alert:boolean = false;
  public play_alert_listeners:string[] = [];
  public moderator_alert_listeners:string[] = [];
  public friend_alert_listeners:string[] = [];
  constructor(private us: UserHttpService, private sio: SocketioService, private router: Router, private m: MatchHttpService, private c: ChatHttpService, private n: NotificationHttpService) {}

  ngOnInit(): void {
    if (this.us.is_moderator()) {
      this.moderator = true;
    }
    this.loadNotifications();
    this.setPlayAlertListeners();
    this.setFriendAlertListeners();
    this.setModeratorAlertListeners();
    this.router.events.subscribe((e: Event) => {
      if (e instanceof RouterEvent) {
        if (e.url === '/play') {
          this.play_alert = false;
        }
        if (e.url === '/friends') {
          this.friends_alert = false;
        }
        if (e.url === '/moderator') {
          this.moderator_alert = false;
        }
      }
    });
    this.sio.connect("nnewmatch").subscribe((d) => {
      if (d.playerOne === this.us.get_id() || d.playerTwo === this.us.get_id()) {
        this.setPlayAlertListeners();
      }
    });
    this.sio.connect("nnewchat" + this.us.get_id()).subscribe((d) => {
      if (d.type === "moderator") {
        this.setModeratorAlertListeners();
      }
      if (d.type === "friend") {
        this.setFriendAlertListeners();
      }
    });
    this.sio.connect("nnewfriendrequest" + this.us.get_username()).subscribe((d) => {
      if (this.router.url !== '/friends') {
        this.friends_alert = true;
      }
    });
    this.sio.connect("nfriendrequestaccepted" + this.us.get_username()).subscribe((d) => {
      if (this.router.url !== '/friends') {
        this.friends_alert = true;
      }
    });
    this.sio.connect("nnewmatchinvite" + this.us.get_username()).subscribe((d) => {
      if (this.router.url !== '/friends') {
        this.friends_alert = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.sio.removeListener("nnewmatch");
    this.removePlayAlertListeners();
    this.sio.removeListener("nnewchat" + this.us.get_id());
    this.removeModeratorAlertListeners();
    this.sio.removeListener("nnewfriendrequest" + this.us.get_username());
    this.sio.removeListener("nfriendrequestaccepted" + this.us.get_username());
    this.sio.removeListener("nnewmatchinvite" + this.us.get_username());
    this.removeFriendAlertListeners();
  }

  loadNotifications(): void {
    this.n.get_notifications().subscribe({
      next: (d) => {
        if (this.router.url !== '/friends') {
          this.friends_alert = d.friend_request || d.friend_request_accepted || d.match_invite;
        }
        if (d.friend_messages.length > 0 && this.router.url !== '/friends') {
          this.friends_alert = true;
        }
        if (this.moderator) {
          if (d.moderator_messages.length > 0 && this.router.url !== '/moderator') {
            this.moderator_alert = true;
          }
        } else {
          if (d.moderator_messages.length > 0 && this.router.url !== '/friends') {
            this.friends_alert = true;
          }
        }
        if (d.match_alerts.length > 0 && this.router.url !== '/play') {
          this.play_alert = true;
        }
        console.log("Alerts loaded");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
      }
    });
  }

  setFriendAlertListeners() {
    this.removeFriendAlertListeners();
    this.friend_alert_listeners = [];
    this.c.get_friends_chat().subscribe({
      next: (d) => {
        for (let chat of d) {
          this.friend_alert_listeners.push(chat._id);
          this.sio.connect("nnewmessage" + chat._id).subscribe((d) => {
            if (this.router.url !== '/friends') {
              this.friends_alert = true;
            }
          });
        }
        console.log("Friend alerts loaded");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
      }
    });
  }

  removeFriendAlertListeners() {
    for (let id of this.friend_alert_listeners) {
      this.sio.removeListener("nnewmessage" + id);
    }
  }

  setModeratorAlertListeners() {
    this.removeModeratorAlertListeners();
    this.moderator_alert_listeners = [];
    this.c.get_moderator_chats(this.us.get_id()).subscribe({
      next: (d) => {
        for (let chat of d) {
          this.moderator_alert_listeners.push(chat._id);
          this.sio.connect("nnewmessage" + chat._id).subscribe((d) => {
            if (this.router.url !== '/moderator') {
              if (this.moderator) {
                this.moderator_alert = true;
              } else {
                this.friends_alert = true;
              }
            }
          });
        }
        console.log("Moderator alerts loaded");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
      }
    });
  }

  removeModeratorAlertListeners() {
    for (let id of this.moderator_alert_listeners) {
      this.sio.removeListener("nnewmessage" + id);
    }
  }

  setPlayAlertListeners() {
    this.removePlayAlertListeners();
    this.play_alert_listeners = [];
    this.m.get_user_matches().subscribe({
      next: (d) => {
        for (let match of d) {
          if (match.result === "0-0") {
            this.play_alert_listeners.push(match._id);
            this.sio.connect("n" + match._id).subscribe((d) => {
              if (this.router.url !== '/play' && !this.router.url.startsWith('/play/match')) {
                this.play_alert = true;
              }
            });
          }
        }
        console.log("Play alerts loaded");
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
      }
    });
  }

  removePlayAlertListeners() {
    for (let id of this.play_alert_listeners) {
      this.sio.removeListener("n" + id);
    }
  }

  load(link:string, event:any) {
    event.preventDefault();
    this.router.navigateByUrl('/profile', {skipLocationChange: true}).then(() => {
      this.router.navigate([link]);
    });
  }

  logout() {
    this.sio.removeListener("nnewmatch");
    this.removePlayAlertListeners();
    this.sio.removeListener("nnewchat" + this.us.get_id());
    this.removeModeratorAlertListeners();
    this.sio.removeListener("nnewfriendrequest" + this.us.get_username());
    this.sio.removeListener("nfriendrequestaccepted" + this.us.get_username());
    this.sio.removeListener("nnewmatchinvite" + this.us.get_username());
    this.removeFriendAlertListeners();
    this.us.logout();
    this.router.navigate(['/login']);
  }
}
