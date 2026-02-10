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
      description: 'Learn how to set up a modern Angular blog with SCSS variables and a neo-retro terminal aesthetic.',
      date: new Date('2025-02-01'),
      tags: ['Angular', 'Frontend', 'Design'],
      content: `
# Getting Started with Angular

Welcome to **ChuckyLab Blogs**! This post is rendered using \`ngx-markdown\` with full syntax highlighting powered by PrismJS.

## Why Angular?

Angular provides a robust framework for building scalable web applications. Combined with SCSS, you get:

- **Type-safe** component architecture
- **Reactive** data patterns with RxJS
- **Powerful** CLI for scaffolding and building
- **Tree-shakable** dependency injection

## Quick Setup

Here's how to bootstrap an Angular application with standalone components:

\`\`\`typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
\`\`\`

## SCSS Variables for Theming

Using SCSS variables makes theming consistent across your entire application:

\`\`\`typescript
// Define your color palette
$color-primary: hsl(142, 76%, 56%);   // Terminal green
$color-secondary: hsl(186, 90%, 55%); // Retro cyan
$color-bg: hsl(210, 20%, 6%);         // CRT dark

// Apply with mixins
@mixin terminal-glow($color) {
  box-shadow: 0 0 10px rgba($color, 0.4);
  text-shadow: 0 0 6px rgba($color, 0.3);
}
\`\`\`

## Key Formula

The beauty of code can be expressed mathematically:

$$ E = mc^2 $$

> "Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke

## What's Next?

Check out the other posts for deep dives into Python data analysis, terminal UI design, and more.
      `
    },
    {
      slug: 'python-data-analysis',
      title: 'Python for Data Analysis',
      description: 'A deep dive into Pandas and NumPy for analyzing large datasets with practical examples.',
      date: new Date('2025-01-28'),
      tags: ['Python', 'Data Science'],
      content: `
# Data Analysis with Python

Python's data science ecosystem is unmatched. Let's explore the core tools.

## Setting Up Your Environment

\`\`\`bash
pip install pandas numpy matplotlib seaborn
\`\`\`

## Working with DataFrames

Pandas DataFrames are the backbone of data analysis in Python:

\`\`\`python
import pandas as pd
import numpy as np

# Create a sample dataset
data = {
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'score': [95, 87, 92, 88],
    'department': ['Engineering', 'Science', 'Engineering', 'Science']
}

df = pd.DataFrame(data)

# Group by department and calculate stats
summary = df.groupby('department')['score'].agg(['mean', 'std', 'count'])
print(summary)
\`\`\`

## Data Pipeline Architecture

Here's how a typical data pipeline flows:

\`\`\`mermaid
graph TD;
    A[Raw Data] -->|Extract| B[Data Lake];
    B -->|Transform| C[Clean Data];
    C -->|Load| D[Data Warehouse];
    D -->|Analyze| E[Dashboards];
    D -->|ML Pipeline| F[Predictions];
\`\`\`

## Key Takeaways

| Feature | Pandas | NumPy |
|---------|--------|-------|
| Data Structure | DataFrame | ndarray |
| Best For | Tabular Data | Numerical Computing |
| Speed | Fast | Faster |
| Memory | Higher | Lower |

> **Pro tip:** Always use vectorized operations instead of loops for performance-critical code.
      `
    },
    {
      slug: 'terminal-ui-design',
      title: 'Designing Terminal-Inspired User Interfaces',
      description: 'How to create modern web UIs that capture the nostalgic feel of retro terminals with pixel-perfect CSS.',
      date: new Date('2025-02-05'),
      tags: ['Design', 'CSS', 'Frontend'],
      content: `
# Terminal UI Design

Creating a terminal-inspired UI is about balancing nostalgia with modern usability.

## The Aesthetic Pillars

1. **Monospaced Typography** — Everything in \`Fira Code\` or \`JetBrains Mono\`
2. **Phosphor Glow** — Subtle green/cyan text shadows
3. **Pixel Borders** — Sharp, minimal border-radius
4. **CRT Scanlines** — Barely-visible overlay for atmosphere
5. **Dark Backgrounds** — Deep blacks with subtle blue undertones

## CSS Glow Effect

\`\`\`typescript
// SCSS mixin for terminal glow
@mixin terminal-glow($color: #4ade80) {
  text-shadow: 0 0 6px rgba($color, 0.3);
  box-shadow: 0 0 10px rgba($color, 0.2),
              inset 0 1px 0 rgba($color, 0.05);
}

.terminal-panel {
  @include terminal-glow();
  background: rgba(15, 18, 25, 0.6);
  border: 1px solid rgba($color, 0.2);
  backdrop-filter: blur(8px);
}
\`\`\`

## CRT Scanline Overlay

The scanline effect uses a repeating gradient that's nearly invisible but adds authenticity:

\`\`\`typescript
body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
}
\`\`\`

## Mechanical Key Buttons

Buttons should feel like pressing a physical key:

\`\`\`typescript
.btn-key {
  border-bottom: 3px solid rgba(74, 222, 128, 0.4);
  transition: all 0.15s ease;

  &:active {
    transform: translateY(1px);
    border-bottom-width: 2px;
  }
}
\`\`\`

> The best terminal UIs make you *feel* like a hacker, even if you're just reading a blog post.
      `
    },
    {
      slug: 'rust-systems-programming',
      title: 'Why Rust is the Future of Systems Programming',
      description: 'Exploring memory safety, zero-cost abstractions, and why Rust is gaining massive adoption.',
      date: new Date('2025-02-08'),
      tags: ['Rust', 'Systems', 'Programming'],
      content: `
# Rust: Systems Programming Reimagined

Rust combines low-level control with high-level ergonomics. Let's explore why.

## Memory Safety Without Garbage Collection

Rust's ownership system prevents entire classes of bugs at compile time:

\`\`\`bash
# The ownership model
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;     // s1 is MOVED, not copied
    // println!("{}", s1);  // ERROR: s1 no longer valid
    println!("{}", s2);     // OK: s2 owns the data
}
\`\`\`

## Error Handling

Rust uses \`Result\` and \`Option\` instead of exceptions:

\`\`\`bash
use std::fs;

fn read_config(path: &str) -> Result<String, std::io::Error> {
    let contents = fs::read_to_string(path)?;
    Ok(contents)
}

fn main() {
    match read_config("config.toml") {
        Ok(config) => println!("Config: {}", config),
        Err(e) => eprintln!("Error: {}", e),
    }
}
\`\`\`

## Adoption Growth

\`\`\`mermaid
graph LR;
    A[2015: Rust 1.0] --> B[2020: Major Adoption];
    B --> C[2023: Linux Kernel];
    C --> D[2025: Industry Standard];
\`\`\`

## Why Developers Love Rust

| Feature | Benefit |
|---------|---------|
| Ownership | No null pointer exceptions |
| Borrowing | Thread safety guaranteed |
| Traits | Powerful abstraction |
| Cargo | Best-in-class package manager |
| Zero-cost abstractions | C++ speed, Rust safety |

> "Rust is the only language where I feel confident my code is correct." — Anonymous developer
      `
    },
    {
      slug: 'devops-ci-cd-pipeline',
      title: 'Building a Modern CI/CD Pipeline',
      description: 'From code commit to production deployment — automating your entire workflow with GitHub Actions.',
      date: new Date('2025-02-10'),
      tags: ['DevOps', 'CI/CD', 'GitHub'],
      content: `
# Modern CI/CD Pipeline

Automating your development workflow is essential for shipping quality software fast.

## GitHub Actions Workflow

Here's a complete CI/CD pipeline configuration:

\`\`\`bash
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Deploy
        run: |
          echo "Deploying to production..."
          # Your deployment command here
\`\`\`

## Pipeline Architecture

\`\`\`mermaid
graph LR;
    A[Push Code] --> B[Run Tests];
    B --> C{Tests Pass?};
    C -->|Yes| D[Build Artifacts];
    C -->|No| E[Notify Team];
    D --> F[Deploy Staging];
    F --> G[Run E2E Tests];
    G --> H[Deploy Production];
\`\`\`

## Key Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Build Time | < 5 min | Developer productivity |
| Test Coverage | > 80% | Code quality |
| Deploy Frequency | Daily | Continuous delivery |
| MTTR | < 1 hour | Reliability |

## Best Practices

- **Never** deploy on Fridays
- **Always** have rollback capability
- **Use** feature flags for gradual rollouts
- **Monitor** everything in production

> "If it hurts, do it more frequently." — Martin Fowler on CI/CD
      `
    }
  ];

  constructor() { }

  getPosts(): Observable<BlogPost[]> {
    return of(this.posts.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  }

  getPost(slug: string): Observable<BlogPost | undefined> {
    const post = this.posts.find(p => p.slug === slug);
    return of(post);
  }

  getAllTags(): string[] {
    const tags = new Set<string>();
    this.posts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }
}
