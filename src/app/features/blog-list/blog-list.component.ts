import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { BlogService, BlogPost } from '../../services/blog.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, AsyncPipe, DatePipe],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss'
})
export class BlogListComponent implements OnInit {
  private blogService = inject(BlogService);
  posts$: Observable<BlogPost[]> | undefined;

  ngOnInit() {
    this.posts$ = this.blogService.getPosts();
  }
}
