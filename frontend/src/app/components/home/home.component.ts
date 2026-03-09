import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(public authService: AuthService, private router: Router) {}

  goToExplore(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/explore']);
    } else {
      this.router.navigate(['/register']);
    }
  }

  features = [
    {
      icon: '🎲',
      title: 'Pure Discovery',
      desc: 'Explore trending videos from regions and categories you\'ve never seen — no watch history steering the ship.',
    },
    {
      icon: '🌍',
      title: 'Global Reach',
      desc: 'Browse content from 12 countries and every YouTube category. Japan, Brazil, Nigeria — the internet is vast.',
    },
    {
      icon: '⚡',
      title: 'Surprise Me',
      desc: 'One click. One completely random video from anywhere on the platform. The algorithm has no say here.',
    },
    {
      icon: '📚',
      title: 'Save & Curate',
      desc: 'Bookmark the gems you discover. Build your own collection without the noise.',
    },
  ];
}
