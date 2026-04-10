import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

const STORAGE_KEY = 'chuckylab.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _current$ = new BehaviorSubject<string>(this.readInitial());
  readonly current$ = this._current$.asObservable();

  // Seeded with the default language so the dropdown is never empty before the
  // first list fetch populates the real set.
  readonly available$ = new BehaviorSubject<string[]>([environment.defaultLang]);

  get current(): string {
    return this._current$.value;
  }

  set(lang: string): void {
    if (!lang || lang === this._current$.value) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage may be unavailable (private mode, SSR) — ignore.
    }
    this._current$.next(lang);
  }

  /** Called by BlogService after a successful list fetch. */
  setAvailable(langs: string[]): void {
    const sorted = Array.from(new Set(langs)).sort();
    const prev = this.available$.value;
    if (sorted.length === prev.length && sorted.every((l, i) => l === prev[i])) {
      return;
    }
    this.available$.next(sorted);
  }

  private readInitial(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? environment.defaultLang;
    } catch {
      return environment.defaultLang;
    }
  }
}
