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

  public errmessage = "";
  public user = {username: '', name: '', surname: '', mail: '', password: ''};
  constructor(private us: UserHttpService, private uss: UsersHttpService, private router: Router) {}

  ngOnInit(): void {
    this.uss.get_user_id(this.us.get_id()).subscribe({
      next: (d) => {
        if (!d.temporary) {
          this.router.navigate(['/play']);
        }
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }

  post_user() {
    this.uss.patch_user(this.us.get_username(), this.user).subscribe({
      next: (d) => {
        console.log("User updated");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    });
  }
}
