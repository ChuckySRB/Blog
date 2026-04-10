import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { BlogService, BlogPost } from '../../services/blog.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss'
})
export class BlogListComponent implements OnInit, OnDestroy {
  private blogService = inject(BlogService);
  private langService = inject(LanguageService);

  allPosts: BlogPost[] = [];
  filteredPosts: BlogPost[] = [];
  allTags: string[] = [];
  selectedTag = '';
  searchQuery = '';
  sortOrder: 'newest' | 'oldest' = 'newest';
  isLoading = true;

  private sub?: Subscription;

  ngOnInit() {
    // Refetch whenever the user switches language.
    this.sub = this.langService.current$
      .pipe(switchMap(lang => {
        this.isLoading = true;
        return this.blogService.getPosts(lang);
      }))
      .subscribe(posts => {
        this.allPosts = posts;
        const tagSet = new Set<string>();
        posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
        this.allTags = Array.from(tagSet).sort();
        this.applyFilters();
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  applyFilters() {
    let result = [...this.allPosts];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (this.selectedTag) {
      result = result.filter(p => p.tags.includes(this.selectedTag));
    }

    result.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return this.sortOrder === 'newest' ? diff : -diff;
    });

    this.filteredPosts = result;
  }

  toggleTag(tag: string) {
    this.selectedTag = this.selectedTag === tag ? '' : tag;
    this.applyFilters();
  }

  toggleSort() {
    this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedTag = '';
    this.sortOrder = 'newest';
    this.applyFilters();
  }
}
