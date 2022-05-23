import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { UsersHttpService } from '../users-http.service';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {

  public errmessage = undefined;
  public user = {username: '', name: '', surname: '', mail: '', password: ''};
  constructor(private us: UserHttpService, private uss: UsersHttpService, private router: Router) {}

  ngOnInit(): void {}

  post_user() {
    this.uss.patch_user(this.us.get_username(), this.user).subscribe({
      next: (d) => {
        console.log("User updated");
        this.router.navigate(['/login']);
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
