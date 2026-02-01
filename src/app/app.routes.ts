import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'blog',
        loadComponent: () => import('./features/blog-list/blog-list.component').then(m => m.BlogListComponent)
    },
    {
        path: 'blog/:slug',
        loadComponent: () => import('./features/blog-post/blog-post.component').then(m => m.BlogPostComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
