import { Component, Input, OnInit } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { Chat, ChatHttpService } from '../chat-http.service';
import { Message, MessageHttpService } from '../message-http.service';
import { UsersHttpService } from '../users-http.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  public errmessage = undefined;
  public notification = "";
  public chat = {} as Chat;
  @Input() chat_id = "";
  public messages:Message[] = [];
  constructor(private us: UserHttpService, private c: ChatHttpService, private m: MessageHttpService, private router: Router, private sio: SocketioService, private route: ActivatedRoute, private uss: UsersHttpService) {}

  ngOnInit(): void {
    if (this.chat_id === "") {
      this.chat_id = this.route.snapshot.paramMap.get('chat_id') || "";
    }
    this.load_chat();
    this.sio.connect("newmessage" + this.chat_id).subscribe((d) => {
      this.load_chat();
    });
  }

  load_chat() {
    this.c.get_chat(this.chat_id).subscribe({
      next: (d) => {
        this.chat = d;
        this.get_messages();
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
        this.messages.reverse();
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
  }

  add_message(message:Message) {
    this.messages.push(message);
  }

  get_owner_username(owner:string) : string {
    let username = "";
    this.uss.get_user_id(owner).subscribe({
      next: (d) => {
        username = d.username;
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
        this.logout();
      }
    });
    return username;
  }

  
  get_date_formatted(m:Message) : string {
    let datetime = m.createdAt.split("T");
    let date = datetime[0].split("-");
    let time = datetime[1].split(":");
    return date[2] + "/" + date[1] + "/" + date[0] + " " + time[0] + ":" + time[1];
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/login']);
  }

}
