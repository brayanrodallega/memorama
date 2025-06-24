import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MemoramaService } from '../../services/memorama.service';
import { StatsService } from '../../services/stats.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser = signal<User | null>(null);
  globalStats = signal<any>(null);
  topPlayers = signal<any[]>([]);
  Math = Math;

  constructor(
    private authService: AuthService,
    private memoramaService: MemoramaService,
    private statsService: StatsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadStats();
  }

  private loadStats(): void {
    this.statsService.getGlobalStats().subscribe(stats => {
      this.globalStats.set(stats);
    });

    this.statsService.getTopPlayers(5).subscribe(players => {
      this.topPlayers.set(players);
    });
  }

  startSinglePlayerGame(): void {
    this.router.navigate(['/game/setup'], { queryParams: { mode: 'single' } });
  }

  startMultiplayerGame(): void {
    this.router.navigate(['/game/setup'], { queryParams: { mode: 'multiplayer' } });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
} 