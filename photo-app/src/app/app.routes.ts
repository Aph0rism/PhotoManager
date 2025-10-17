import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'gallery', pathMatch: 'full' },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.page').then(m => m.GalleryPage)
  },/*
  {
    path: 'photo/:id',
    loadComponent: () => import('./pages/photo-detail/photo-detail.page').then(m => m.PhotoDetailPage)
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.page').then(m => m.MapPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },*/
  { path: '**', redirectTo: 'gallery' }
];
