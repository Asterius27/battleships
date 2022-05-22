import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { Message, MessageHttpService } from '../message-http.service';

@Component({
  selector: 'app-message-editor',
  templateUrl: './message-editor.component.html',
  styleUrls: ['./message-editor.component.css']
})
export class MessageEditorComponent implements OnInit {

  public errmessage = undefined;
  public notification = "";
  @Output() posted = new EventEmitter<Message>();
  @Input() chat_id = "";
  @Input() observer_id = "";
  constructor(private us: UserHttpService, private m: MessageHttpService, private router: Router) {}

  ngOnInit(): void {}

  post_message(message:string) {
    let body = {};
    if (this.observer_id === "") {
      body = {content: message, chat: this.chat_id, visibility: true};
    } else {
      body = {content: message, chat: this.chat_id, visibility: false};
    }
    this.m.post_message(body).subscribe({
      next: (d) => {
        console.log('Message posted');
        this.posted.emit(d);
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
