import { Component, OnInit, inject } from '@angular/core';
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
export class HomeComponent implements OnInit {
  private blogService = inject(BlogService);
  recentPosts$: Observable<BlogPost[]> | undefined;

  ngOnInit() {
    this.recentPosts$ = this.blogService.getPosts().pipe(
      map(posts => posts.slice(0, 3))
    );
  }
}
