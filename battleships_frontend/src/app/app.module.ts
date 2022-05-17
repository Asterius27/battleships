import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { UserHttpService } from './user-http.service';
import { SignupComponent } from './signup/signup.component';
import { SocketioService } from './socketio.service';
import { ChatComponent } from './chat/chat.component';
import { MessageEditorComponent } from './message-editor/message-editor.component';
import { ChatHttpService } from './chat-http.service';
import { MessageHttpService } from './message-http.service';
import { UsersHttpService } from './users-http.service';
import { MatchHttpService } from './match-http.service';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ChatComponent,
    MessageEditorComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {provide: UserHttpService, useClass: UserHttpService},
    {provide: SocketioService, useClass: SocketioService},
    {provide: ChatHttpService, useClass: ChatHttpService},
    {provide: MessageHttpService, useClass: MessageHttpService},
    {provide: UsersHttpService, useClass: UsersHttpService},
    {provide: MatchHttpService, useClass: MatchHttpService}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
