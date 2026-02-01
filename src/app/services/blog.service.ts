import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: Date;
  tags: string[];
  thumbnail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private posts: BlogPost[] = [
    {
      slug: 'getting-started-with-angular',
      title: 'Getting Started with Angular & SCSS',
      description: 'Learn how to set up a modern Angular blog with SCSS variables and glassmorphism.',
      date: new Date('2025-02-01'),
      tags: ['Angular', 'Frontend', 'Design'],
      content: `
# Getting Started

Welcome to your **new blog**! This is rendered using \`ngx-markdown\`.

## Features
- Glassmorphism design
- SCSS Variables
- Rich Content Support

\`\`\`typescript
const greeting = 'Hello World';
console.log(greeting);
\`\`\`

$$ E = mc^2 $$

      `
    },
    {
      slug: 'python-data-analysis',
      title: 'Python for Data Analysis',
      description: 'A deep dive into Pandas and NumPy for analyzing large datasets.',
      date: new Date('2025-01-28'),
      tags: ['Python', 'Data Science'],
      content: `
# Data Analysis with Python

Python is great for data science.

\`\`\`python
import pandas as pd
import numpy as np

df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
print(df.describe())
\`\`\`

Here is a graph (Mermaid):

\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\`\`\`
      `
    }
  ];

  constructor() { }

  getPosts(): Observable<BlogPost[]> {
    return of(this.posts);
  }

  getPost(slug: string): Observable<BlogPost | undefined> {
    const post = this.posts.find(p => p.slug === slug);
    return of(post);
  }
}
