import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LanguageService } from './language.service';

/**
 * A blog "short" as returned by the listing endpoint. Holds title /
 * description for a single, server-chosen language.
 */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: Date;
  tags: string[];

  headImage: string | null;
  appHooks: string[];
  languages: string[];
  translatedByAi: Record<string, boolean>;
  viewCount: number;
  lang: string;
}

/**
 * One language variant of a full blog. The detail endpoint returns a map of
 * these so the frontend can switch languages without re-fetching.
 */
export interface BlogTranslation {
  title: string;
  description: string;
  content: string;          // mapped from content_md, image URLs already rewritten
  mdPath: string;
  translatedByAi: boolean;
}

/**
 * Full blog payload as returned by `GET /api/blogs/<slug>`. Top-level fields
 * are global; per-language fields live inside `translations[lang]`.
 */
export interface BlogFull {
  slug: string;
  date: Date;
  headImage: string | null;
  tags: string[];
  appHooks: string[];
  languages: string[];
  viewCount: number;
  translations: Record<string, BlogTranslation>;
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

interface BlogTranslationDto {
  title: string;
  description: string;
  content_md: string;
  md_path: string;
  translated_by_ai: boolean;
}

interface BlogFullDto {
  slug: string;
  date_posted: string;
  head_image: string | null;
  tags: string[];
  app_hooks: string[];
  languages: string[];
  view_count: number;
  translations: Record<string, BlogTranslationDto>;
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
   * Fetch a single blog by slug. Returns every available translation in one
   * shot — the caller switches languages client-side via `pickTranslation`.
   *
   * NOTE: this endpoint has a side effect — the backend increments
   * `view_count` on every successful call. Call exactly once per page visit.
   * Do NOT re-fetch when the user flips the language picker.
   */
  getPost(slug: string): Observable<BlogFull | undefined> {
    if (!slug) return of(undefined);

    return this.http
      .get<BlogFullDto>(
        `${environment.apiUrl}/api/blogs/${encodeURIComponent(slug)}`,
      )
      .pipe(
        map(dto => this.toBlogFull(dto)),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return of(undefined);
          }
          console.error('[BlogService] getPost failed', err);
          return of(undefined);
        }),
      );
  }

  /**
   * Pick the best-matching translation for `lang`. Falls back to the default
   * language, then to the first available translation alphabetically. Returns
   * undefined only if the blog has no translations at all.
   */
  pickTranslation(blog: BlogFull, lang: string): BlogTranslation | undefined {
    const tr = blog.translations;
    if (tr[lang]) return tr[lang];
    if (tr[environment.defaultLang]) return tr[environment.defaultLang];
    const keys = Object.keys(tr).sort();
    return keys.length ? tr[keys[0]] : undefined;
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

  private toBlogPost(dto: BlogShortDto): BlogPost {
    return {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      date: new Date(dto.date_posted),
      tags: dto.tags ?? [],
      headImage: dto.head_image ? this.buildImageUrl(dto.slug, dto.head_image) : null,
      appHooks: dto.app_hooks ?? [],
      languages: dto.languages ?? [],
      translatedByAi: dto.translated_by_ai ?? {},
      viewCount: dto.view_count ?? 0,
      lang: dto.lang,
    };
  }

  private toBlogFull(dto: BlogFullDto): BlogFull {
    const slug = dto.slug;
    const translations: Record<string, BlogTranslation> = {};
    for (const [lang, t] of Object.entries(dto.translations ?? {})) {
      translations[lang] = {
        title: t.title,
        description: t.description,
        content: this.rewriteContentImages(t.content_md ?? '', slug),
        mdPath: t.md_path,
        translatedByAi: t.translated_by_ai,
      };
    }
    return {
      slug,
      date: new Date(dto.date_posted),
      headImage: dto.head_image ? this.buildImageUrl(slug, dto.head_image) : null,
      tags: dto.tags ?? [],
      appHooks: dto.app_hooks ?? [],
      languages: dto.languages ?? [],
      viewCount: dto.view_count ?? 0,
      translations,
    };
  }

  /**
   * Build a browser-loadable URL for a blog-relative image path like
   * `images/hero.webp`. Slashes inside the relative path are kept intact —
   * only the slug needs URL encoding.
   */
  private buildImageUrl(slug: string, relPath: string): string {
    return `${environment.apiUrl}/api/blogs/${encodeURIComponent(slug)}/${relPath}`;
  }

  /**
   * Rewrite Markdown image references that point at the blog's `images/`
   * folder so they become absolute URLs against the API. Absolute URLs
   * (`http://...`, `https://...`) and other relative paths are left alone.
   */
  private rewriteContentImages(content: string, slug: string): string {
    return content.replace(
      /!\[([^\]]*)\]\((images\/[^)\s]+)\)/g,
      (_match, alt, path) => `![${alt}](${this.buildImageUrl(slug, path)})`
    );
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
