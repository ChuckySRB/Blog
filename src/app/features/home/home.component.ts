import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { BlogService, BlogPost } from '../../services/blog.service';
import { Observable, map, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, DatePipe, UpperCasePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private blogService = inject(BlogService);
  recentPosts$: Observable<BlogPost[]> | undefined;
  currentTime: string = '';
  currentDate: string = '';
  timezone: string = '';
  private clockSubscription?: Subscription;

  ngOnInit() {
    this.recentPosts$ = this.blogService.getPosts().pipe(
      map(posts => posts.slice(0, 6))
    );
    
    // Initialize clock
    this.updateClock();
    this.clockSubscription = interval(1000).subscribe(() => {
      this.updateClock();
    });
  }

  ngOnDestroy() {
    if (this.clockSubscription) {
      this.clockSubscription.unsubscribe();
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    this.currentDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = Math.abs(offsetMinutes / 60);
    this.timezone = 'UTC' + (offsetMinutes <= 0 ? '+' : '-') + offsetHours;
  }
}
