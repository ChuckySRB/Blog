import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { BlogService, BlogPost } from '../../services/blog.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AsyncPipe, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private blogService = inject(BlogService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  recentPosts$: Observable<BlogPost[]> | undefined;

  asciiArt = '';

  typedText = '';
  private fullText = 'Exploring Code, Design, and Technology.';
  private typeTimer: ReturnType<typeof setTimeout> | null = null;
  private charIndex = 0;

  uptimeStr = '00:00:00';
  private uptimeInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = Date.now();

  stats = {
    posts: 0,
    tags: 0,
    linesOfCode: '∞'
  };

  ngOnInit() {
    this.recentPosts$ = this.blogService.getPosts().pipe(
      map(posts => {
        const allTags = new Set<string>();
        posts.forEach(p => p.tags.forEach(t => allTags.add(t)));
        this.stats.posts = posts.length;
        this.stats.tags = allTags.size;
        return posts.slice(0, 3);
      })
    );

    fetch('koro.txt')
      .then(res => res.text())
      .then(text => {
        this.asciiArt = text;
        this.cdr.detectChanges();
      });

    this.ngZone.runOutsideAngular(() => {
      this.startTyping();
      this.uptimeInterval = setInterval(() => this.updateUptime(), 1000);
    });
  }

  ngOnDestroy() {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
  }

  private startTyping() {
    if (this.charIndex < this.fullText.length) {
      this.typedText += this.fullText[this.charIndex];
      this.charIndex++;
      this.cdr.detectChanges();
      this.typeTimer = setTimeout(() => this.startTyping(), 40 + Math.random() * 30);
    }
  }

  private updateUptime() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    this.uptimeStr = `${h}:${m}:${s}`;
    this.cdr.detectChanges();
  }
}
