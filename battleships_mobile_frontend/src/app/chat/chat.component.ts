import { AfterViewChecked, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { Chat, ChatHttpService } from '../chat-http.service';
import { Message, MessageHttpService } from '../message-http.service';
import { UsersHttpService } from '../users-http.service';
import { DOCUMENT } from '@angular/common';
import { NotificationHttpService } from '../notification-http.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {

  public errmessage = "";
  public chat = {} as Chat;
  @Input() chat_id = "";
  @Input() participant_id = "";
  public messages:Message[] = [];
  constructor(private us: UserHttpService, private c: ChatHttpService, private m: MessageHttpService, private n: NotificationHttpService, private router: Router, private sio: SocketioService, private route: ActivatedRoute, private uss: UsersHttpService, @Inject(DOCUMENT) private doc: Document) {}

  ngOnInit(): void {
    if (this.chat_id === "") {
      this.chat_id = this.route.snapshot.paramMap.get('chat_id') || "";
    }
    this.load_chat();
    this.sio.connect("newmessage" + this.chat_id).subscribe((d) => {
      this.load_chat();
      let body = {};
      if (this.chat.type === "friend") {
        for (let participant of this.chat.participants) {
          if (participant !== this.us.get_id()) {
            body = {friend_messages: [participant]};
          }
        }
      }
      if (this.chat.type === "moderator") {
        body = {moderator_messages: [this.chat_id]};
      }
      this.n.delete_notification(body).subscribe({
        next: (d) => {},
        error: (err) => {
          // console.log('Error: ' + JSON.stringify(err));
        }
      });
    });
  }

  ngAfterViewChecked(): void {
    this.doc.getElementById("chat-container")!.scrollTop = this.doc.getElementById("chat-container")!.scrollHeight;
  }

  ngOnDestroy(): void {
    this.sio.removeListener("newmessage" + this.chat_id);
  }

  load_chat() {
    this.c.get_chat(this.chat_id).subscribe({
      next: (d) => {
        this.chat = d;
        if (this.participant_id !== "" && !this.chat.participants.includes(this.participant_id)) {
          this.post_participant();
        }
        this.get_messages();
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  get_messages() {
    let visibility = "true";
    if (this.participant_id !== "") {
      visibility = "false";
    }
    this.m.get_messages(this.chat.messages, visibility).subscribe({
      next: (d) => {
        // console.log('Messages loaded');
        this.messages = d;
        this.messages.reverse();
        this.doc.getElementById("chat-container")!.scrollTop = this.doc.getElementById("chat-container")!.scrollHeight;
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  add_message(message:Message) {
    this.messages.push(message);
    this.doc.getElementById("chat-container")!.scrollTop = this.doc.getElementById("chat-container")!.scrollHeight;
  }

  get_owner_username(owner:string) : string {
    let username = "";
    this.uss.get_user_id(owner).subscribe({
      next: (d) => {
        username = d.username;
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
      }
    });
    return username;
  }

  post_participant() {
    this.c.post_chat_participant(this.chat_id).subscribe({
      next: (d) => {
        // console.log('Participant added');
      },
      error: (err) => {
        // console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }
  
  get_date_formatted(m:Message) : string {
    let datetime = m.createdAt.split("T");
    let date = datetime[0].split("-");
    let time = datetime[1].split(":");
    return date[2] + "/" + date[1] + "/" + date[0] + " " + time[0] + ":" + time[1];
  }

  getMessageStyle(message_owner:string) : string {
    if (message_owner === this.us.get_username()) {
      return "right";
    } else {
      return "left";
    }
  }
}
