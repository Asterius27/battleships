import { Component, OnInit } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { Chat, ChatHttpService } from '../chat-http.service';
import { Message, MessageHttpService } from '../message-http.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  public errmessage = undefined;
  public notification = "";
  public chat = {} as Chat;
  public messages:Message[] = [];
  constructor(private us: UserHttpService, private c: ChatHttpService, private m: MessageHttpService, private router: Router, private sio: SocketioService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.load_chat();
  }

  load_chat() {
    let friend_id = this.route.snapshot.paramMap.get('friend_id') || "";
    this.c.get_friend_chat(friend_id).subscribe({
      next: (d) => {
        if (d) {
          console.log('Chat loaded');
          this.chat = d;
          this.get_messages();
        } else {
          let body:Chat = {_id: "", participants: [friend_id], messages: [], type: "friend"};
          this.c.post_chat(body).subscribe({
            next: (d) => {
              console.log('Chat created and loaded');
              this.chat = d;
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

  get_messages() {
    this.m.get_messages(this.chat.messages).subscribe({
      next: (d) => {
        console.log('Messages loaded');
        this.messages = d;
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
