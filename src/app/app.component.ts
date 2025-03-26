import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Project Management Dashboard';
  currentUser: any = JSON.parse(localStorage.getItem('currentUser') || 'null');

  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout().then(() => {
      this.currentUser = null;
      this.router.navigate(['/login']);
    });
  }
}
