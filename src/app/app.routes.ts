import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirect root to dashboard if logged in, otherwise to login
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  
  // Auth routes (only accessible when not logged in)
  {
    path: 'auth/login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  
  // Game routes (require authentication)
  {
    path: 'game/setup',
    canActivate: [authGuard],
    loadComponent: () => import('./components/game/game-setup/game-setup.component').then(m => m.GameSetupComponent)
  },
  {
    path: 'game/play',
    canActivate: [authGuard],
    loadComponent: () => import('./components/game/game-board/game-board.component').then(m => m.GameBoardComponent)
  },
  
  // Stats and ranking routes (require authentication)
  {
    path: 'stats',
    canActivate: [authGuard],
    loadComponent: () => import('./components/stats/stats.component').then(m => m.StatsComponent)
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () => import('./components/ranking/ranking.component').then(m => m.RankingComponent)
  },
  
  // History route (alias for stats)
  {
    path: 'history',
    redirectTo: 'stats'
  },
  
  // Wildcard route - redirect to home
  {
    path: '**',
    redirectTo: ''
  }
];
