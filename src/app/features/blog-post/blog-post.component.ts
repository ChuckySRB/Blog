import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { BlogService, BlogPost } from '../../services/blog.service';
import { LanguageService } from '../../services/language.service';
import { Observable, combineLatest, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgIf, MarkdownModule, RouterLink],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss'
})
export class BlogPostComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private langService = inject(LanguageService);

  post$: Observable<BlogPost | undefined> | undefined;
  readingProgress = 0;
  estimatedReadTime = 0;
  showBackToTop = false;

  private scrollHandler = () => this.onScroll();

  ngOnInit() {
    // Refetch when either the route slug OR the selected language changes.
    this.post$ = combineLatest([
      this.route.paramMap,
      this.langService.current$
    ]).pipe(
      switchMap(([params, lang]) => {
        const slug = params.get('slug') ?? '';
        return this.blogService.getPost(slug, lang);
      }),
      tap(post => {
        if (post?.content) {
          const wordCount = post.content.split(/\s+/).length;
          this.estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
        } else {
          this.estimatedReadTime = 0;
        }
      })
    );
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  private onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.readingProgress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    this.showBackToTop = scrollTop > 400;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
