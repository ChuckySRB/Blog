import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { BlogService, BlogFull, BlogTranslation } from '../../services/blog.service';
import { LanguageService } from '../../services/language.service';
import { Observable, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';

interface PostView {
  blog: BlogFull;
  translation: BlogTranslation;
}

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgIf, MarkdownModule, RouterLink],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogPostComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  view$: Observable<PostView | undefined> | undefined;
  readingProgress = 0;
  estimatedReadTime = 0;
  showBackToTop = false;

  private scrollHandler = () => this.onScroll();
  private rafId: number | null = null;

  ngOnInit() {
    // Fetch the full blog ONCE per slug — every translation comes back in
    // the same response. shareReplay so language flips don't re-trigger the
    // HTTP call (and don't re-increment view_count on the backend).
    const blog$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug') ?? '';
        return this.blogService.getPost(slug);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.view$ = combineLatest([blog$, this.langService.current$]).pipe(
      map(([blog, lang]) => {
        if (!blog) return undefined;
        const translation = this.blogService.pickTranslation(blog, lang);
        if (!translation) return undefined;
        return { blog, translation };
      }),
      tap(view => {
        if (view) {
          const wordCount = view.translation.content.split(/\s+/).length;
          this.estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
        } else {
          this.estimatedReadTime = 0;
        }
      })
    );
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private onScroll() {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.readingProgress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      this.showBackToTop = scrollTop > 400;
      this.rafId = null;
      this.cdr.markForCheck();
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
