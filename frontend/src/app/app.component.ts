import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <main class="app-main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-main {
      min-height: calc(100vh - 64px);
    }
  `]
})
export class AppComponent {
  title = 'NewTube';
}
