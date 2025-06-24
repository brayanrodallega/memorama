import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsService, RankingEntry, GameMatch } from '../../services/stats.service';
import { AuthService } from '../../services/auth.service';
import { PaginationService } from '../../services/pagination.service';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  userStats = signal<RankingEntry | null>(null);
  globalStats = signal<any>(null);
  
  // Control de pestañas para el historial de partidas
  activeMatchTab = signal<'single' | 'multi'>('single');
  
  // Paginación para partidas separadas por modo
  private singlePlayerMatchesPagination!: ReturnType<typeof this.paginationService.createPaginationState<GameMatch>>;
  private multiplayerMatchesPagination!: ReturnType<typeof this.paginationService.createPaginationState<GameMatch>>;
  
  paginatedSinglePlayerMatches = () => this.singlePlayerMatchesPagination.paginatedData();
  paginatedMultiplayerMatches = () => this.multiplayerMatchesPagination.paginatedData();

  // Paginación para jugadores
  private playersPagination!: ReturnType<typeof this.paginationService.createPaginationState<RankingEntry>>;
  paginatedPlayers = () => this.playersPagination.paginatedData();

  // Computed signal para obtener los datos paginados según la pestaña activa
  paginatedMatches = () => {
    if (this.activeMatchTab() === 'single') {
      return this.singlePlayerMatchesPagination.paginatedData();
    } else {
      return this.multiplayerMatchesPagination.paginatedData();
    }
  };

  Math = Math;

  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private paginationService: PaginationService
  ) {
    // Inicializar paginación en el constructor
    this.singlePlayerMatchesPagination = this.paginationService.createPaginationState<GameMatch>(6);
    this.multiplayerMatchesPagination = this.paginationService.createPaginationState<GameMatch>(6);
    this.playersPagination = this.paginationService.createPaginationState<RankingEntry>(6);
  }

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    const currentUser = this.authService.getCurrentUser();
    
    // Cargar estadísticas del usuario actual
    if (currentUser?.id) {
      this.statsService.getUserStats(currentUser.id).subscribe(stats => {
        this.userStats.set(stats);
      });
    }

    // Cargar estadísticas globales
    this.statsService.getGlobalStats().subscribe(stats => {
      this.globalStats.set(stats);
    });

    // Cargar partidas separadas por modo y ordenadas por fecha (más recientes primero)
    this.statsService.getMatchesByModeOrderedByDate(50).subscribe(matchesByMode => {
      this.singlePlayerMatchesPagination.setItems(matchesByMode.singlePlayer);
      this.multiplayerMatchesPagination.setItems(matchesByMode.multiplayer);
    });

    // Cargar top jugadores con paginación
    this.statsService.getTopPlayers(50).subscribe(players => {
      this.playersPagination.setItems(players);
    });
  }

  setActiveMatchTab(tab: 'single' | 'multi'): void {
    this.activeMatchTab.set(tab);
  }

  onMatchesPageChange(page: number): void {
    if (this.activeMatchTab() === 'single') {
      this.singlePlayerMatchesPagination.goToPage(page);
    } else {
      this.multiplayerMatchesPagination.goToPage(page);
    }
  }

  onPlayersPageChange(page: number): void {
    this.playersPagination.goToPage(page);
  }

  getPlayerGlobalRank(player: RankingEntry, localIndex: number): number {
    const currentPage = this.paginatedPlayers().pagination.currentPage;
    const itemsPerPage = this.paginatedPlayers().pagination.itemsPerPage;
    return (currentPage - 1) * itemsPerPage + localIndex + 1;
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
} 