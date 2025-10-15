// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'home',  loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'movie/:id', loadComponent: () => import('./pages/movie-detail/movie-detail.component').then(m => m.MovieDetailComponent) },
  { path: 'saved', loadComponent: () => import('./pages/saved-movies/saved-movies.component').then(m => m.SavedMoviesComponent) },
  { path: 'reviews', loadComponent: () => import('./pages/my-reviews/my-reviews.component').then(m => m.MyReviewsComponent) },
  { path: '**', redirectTo: 'login' }
];