import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  protected langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  navItems = [
    { label: '~/home', path: '/', icon: '⌂' },
    { label: '~/blog', path: '/blog', icon: '✎' },
    { label: '~/projects', path: '/projects', icon: '◈' }
  ];

  currentTime = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.updateClock();
    this.ngZone.runOutsideAngular(() => {
      this.clockInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.updateClock();
          this.cdr.markForCheck();
        });
      }, 1000);
    });
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
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
