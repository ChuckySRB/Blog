import { Component, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  protected langService = inject(LanguageService);

  navItems = [
    { label: '~/home', path: '/', icon: '⌂' },
    { label: '~/blog', path: '/blog', icon: '✎' },
    { label: '~/projects', path: '/projects', icon: '◈' }
  ];

  currentTime = '';
  private clockInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.clockInterval);
  }

  onLangChange(lang: string) {
    this.langService.set(lang);
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
