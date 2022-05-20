import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { FriendsComponent } from './friends/friends.component';
import { GamePhaseTwoComponent } from './game-phase-two/game-phase-two.component';
import { GameComponent } from './game/game.component';
import { LoginComponent } from './login/login.component';
import { PlayComponent } from './play/play.component';
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent},
  {path: 'play', component: PlayComponent},
  {path: 'play/match', component: GameComponent},
  {path: 'play/match/two', component: GamePhaseTwoComponent},
  {path: 'friends', component: FriendsComponent},
  {path: 'chat', component: ChatComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
