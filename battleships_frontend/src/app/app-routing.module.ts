import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { FriendsComponent } from './friends/friends.component';
import { GameComponent } from './game/game.component';
import { LoginComponent } from './login/login.component';
import { ModeratorComponent } from './moderator/moderator.component';
import { PlayComponent } from './play/play.component';
import { ProfileComponent } from './profile/profile.component';
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'profile/edit', component: EditUserComponent},
  {path: 'play', component: PlayComponent},
  {path: 'play/match', component: GameComponent},
  {path: 'friends', component: FriendsComponent},
  {path: 'chat', component: ChatComponent},
  {path: 'moderator', component: ModeratorComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
