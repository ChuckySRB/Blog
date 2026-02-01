import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { BlogService, BlogPost } from '../../services/blog.service';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgIf, MarkdownModule, RouterLink], // MarkdownModule for rendering
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss'
})
export class BlogPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);

  post$: Observable<BlogPost | undefined> | undefined;

  ngOnInit() {
    this.post$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');
        return this.blogService.getPost(slug || '');
      })
    );
  }
}
