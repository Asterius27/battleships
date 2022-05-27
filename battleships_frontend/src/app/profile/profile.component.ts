import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserHttpService } from '../user-http.service';
import { UsersHttpService } from '../users-http.service';
import { ChartType, ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  public errmessage = "";
  public username:string = "";
  public user_id:string = "";
  public doughnutChartLabels:string[] = ['Wins', 'Losses'];
  public doughnutChartData:ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: []
  };
  public doughnutChartType:ChartType = 'doughnut';
  public doughnutChartOptions:ChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let percentage = 0.;
            if (typeof context.dataset.data[0] === "number" && typeof context.dataset.data[1] === "number") {
              if (context.dataset.data[0] + context.dataset.data[1] !== 0) {
                percentage = ((context.parsed * 1.) / (context.dataset.data[0] + context.dataset.data[1])) * 100.
              }
            }
            return context.label + ": " + context.formattedValue + " (" + percentage.toFixed(2) + " %)";
          }
        }
      }
    }
  };
  constructor(private us: UserHttpService, private uss: UsersHttpService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username') || "";
    this.user_id = this.route.snapshot.paramMap.get('user_id') || "";
    if (this.username === "") {
      this.username = this.us.get_username();
    }
    if (this.user_id === "") {
      this.user_id = this.us.get_id();
    }
    this.load_stats();
  }

  load_stats() {
    this.uss.get_user_stats(this.user_id).subscribe({
      next: (d) => {
        console.log("Stats loaded");
        this.doughnutChartData.datasets = [];
        this.doughnutChartData.datasets.push({data: [d.wins, d.losses]});
      },
      error: (err) => {
        console.log('Error: ' + JSON.stringify(err));
        this.errmessage = "Something went wrong, please try again";
        setTimeout(() => {this.errmessage = ""}, 3000);
      }
    })
  }
}
