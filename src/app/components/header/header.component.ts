import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  navItems = [
    { label: '~/home', path: '/', icon: '⌂' },
    { label: '~/blog', path: '/blog', icon: '✎' },
    { label: '~/projects', path: '/projects', icon: '◈' }
  ];

  currentTime = '';

  constructor() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  private updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
