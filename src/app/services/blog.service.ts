import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LanguageService } from './language.service';

/**
 * Public blog model. Templates bind against this shape.
 *
 * `content` is only present after a successful `getPost()`; the list endpoint
 * does not return it. `headImage` and any embedded `![](images/...)` references
 * are raw path strings until the backend ships its static-image endpoint.
 */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content?: string;
  date: Date;
  tags: string[];

  headImage: string | null;
  appHooks: string[];
  languages: string[];
  translatedByAi: Record<string, boolean>;
  viewCount: number;
  lang: string;
  mdPath?: string;
}

// ---- Internal DTOs (snake_case as returned by the backend) ----

interface BlogShortDto {
  slug: string;
  title: string;
  description: string;
  date_posted: string;
  head_image: string | null;
  tags: string[];
  app_hooks: string[];
  languages: string[];
  translated_by_ai: Record<string, boolean>;
  view_count: number;
  lang: string;
}

interface BlogFullDto extends BlogShortDto {
  content_md: string;
  md_path: string;
}

interface ListCacheEntry {
  etag: string | null;
  posts: BlogPost[];
}

interface ViewsCacheEntry {
  etag: string | null;
  data: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private langService = inject(LanguageService);

  /** Cached list responses keyed by language. Survives navigation, lost on hard refresh. */
  private listCache = new Map<string, ListCacheEntry>();
  private viewsCache: ViewsCacheEntry | null = null;

  /**
   * Fetch the blog list for a given language. Uses ETag-based conditional
   * fetching: if a cached entry exists, sends `If-None-Match` and returns
   * the cached payload on 304.
   */
  getPosts(lang: string = this.langService.current): Observable<BlogPost[]> {
    const cached = this.listCache.get(lang);

    const params = new HttpParams().set('lang', lang);
    let headers = new HttpHeaders();
    if (cached?.etag) {
      headers = headers.set('If-None-Match', cached.etag);
    }

    return this.http
      .get<BlogShortDto[]>(`${environment.apiUrl}/api/blogs`, {
        params,
        headers,
        observe: 'response',
      })
      .pipe(
        map(resp => {
          const etag = resp.headers.get('ETag');
          const posts = (resp.body ?? []).map(dto => this.toBlogPost(dto));
          this.listCache.set(lang, { etag, posts });
          this.publishAvailableLanguages(posts);
          return posts;
        }),
        catchError((err: HttpErrorResponse) => {
          // Angular HttpClient surfaces 304 as an error because the body is
          // empty. That's expected when the cached ETag still matches.
          if (err.status === 304 && cached) {
            return of(cached.posts);
          }
          console.error('[BlogService] getPosts failed', err);
          return of(cached?.posts ?? []);
        }),
      );
  }

  /**
   * Fetch a single blog by slug. NOTE: this endpoint has a side effect — the
   * backend increments `view_count` on every successful call. Do not call from
   * prefetch / hover handlers.
   */
  getPost(
    slug: string,
    lang: string = this.langService.current,
  ): Observable<BlogPost | undefined> {
    if (!slug) return of(undefined);

    const params = new HttpParams().set('lang', lang);
    return this.http
      .get<BlogFullDto>(
        `${environment.apiUrl}/api/blogs/${encodeURIComponent(slug)}`,
        { params },
      )
      .pipe(
        map(dto => this.toBlogPost(dto)),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return of(undefined);
          }
          console.error('[BlogService] getPost failed', err);
          // Best-effort fallback to list metadata so the header at least renders.
          const cached = this.listCache.get(lang);
          return of(cached?.posts.find(p => p.slug === slug));
        }),
      );
  }

  /**
   * Refresh view counts without re-fetching the whole listing. Returns
   * `{slug: count}`. Uses ETag conditional fetching like the list endpoint.
   * Provided as a primitive — no automatic polling timer.
   */
  getViews(): Observable<Record<string, number>> {
    let headers = new HttpHeaders();
    if (this.viewsCache?.etag) {
      headers = headers.set('If-None-Match', this.viewsCache.etag);
    }

    return this.http
      .get<Record<string, number>>(`${environment.apiUrl}/api/blogs/views`, {
        headers,
        observe: 'response',
      })
      .pipe(
        map(resp => {
          const etag = resp.headers.get('ETag');
          const data = resp.body ?? {};
          this.viewsCache = { etag, data };
          return data;
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 304 && this.viewsCache) {
            return of(this.viewsCache.data);
          }
          console.error('[BlogService] getViews failed', err);
          return of(this.viewsCache?.data ?? {});
        }),
      );
  }

  // TODO: image endpoint — once the backend serves image bytes, prepend an
  // imageBaseUrl to head_image and rewrite ![](images/...) inside content_md
  // before handing it to <markdown>.
  private toBlogPost(dto: BlogShortDto | BlogFullDto): BlogPost {
    const post: BlogPost = {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      date: new Date(dto.date_posted),
      tags: dto.tags ?? [],
      headImage: dto.head_image ?? null,
      appHooks: dto.app_hooks ?? [],
      languages: dto.languages ?? [],
      translatedByAi: dto.translated_by_ai ?? {},
      viewCount: dto.view_count ?? 0,
      lang: dto.lang,
    };
    if ('content_md' in dto) {
      post.content = dto.content_md;
      post.mdPath = dto.md_path;
    }
    return post;
  }

  private publishAvailableLanguages(posts: BlogPost[]): void {
    const langs = new Set<string>();
    for (const p of posts) {
      for (const l of p.languages) langs.add(l);
    }
    if (langs.size > 0) {
      this.langService.setAvailable(Array.from(langs));
    }
  }
}
