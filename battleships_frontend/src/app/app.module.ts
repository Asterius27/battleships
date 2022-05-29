import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout'
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
import { NavbarComponent } from './navbar/navbar.component';
import { GameComponent } from './game/game.component';
import { FriendsComponent } from './friends/friends.component';
import { PlayComponent } from './play/play.component';
import { GamePhaseTwoComponent } from './game-phase-two/game-phase-two.component';
import { GameObserveComponent } from './game-observe/game-observe.component';
import { GamePhaseOneComponent } from './game-phase-one/game-phase-one.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ModeratorComponent } from './moderator/moderator.component';
import { ProfileComponent } from './profile/profile.component';
import { NgChartsModule } from 'ng2-charts';
import { NotificationHttpService } from './notification-http.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ChatComponent,
    MessageEditorComponent,
    NavbarComponent,
    GameComponent,
    FriendsComponent,
    PlayComponent,
    GamePhaseTwoComponent,
    GameObserveComponent,
    GamePhaseOneComponent,
    EditUserComponent,
    ModeratorComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    FlexLayoutModule,
    NgChartsModule
  ],
  providers: [
    {provide: UserHttpService, useClass: UserHttpService},
    {provide: SocketioService, useClass: SocketioService},
    {provide: ChatHttpService, useClass: ChatHttpService},
    {provide: MessageHttpService, useClass: MessageHttpService},
    {provide: UsersHttpService, useClass: UsersHttpService},
    {provide: MatchHttpService, useClass: MatchHttpService},
    {provide: NotificationHttpService, useClass: NotificationHttpService}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
