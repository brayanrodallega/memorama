import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsService, RankingEntry, GameMatch } from '../../services/stats.service';
import { AuthService } from '../../services/auth.service';
import { PaginationService } from '../../services/pagination.service';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss'
})
export class RankingComponent implements OnInit {
  activeTab = signal<'game' | 'global' | 'matches'>('game');
  
  // Control de pestañas para el historial de partidas (cuando activeTab === 'matches')
  activeMatchTab = signal<'single' | 'multi'>('single');
  
  // Datos originales sin paginación
  gameRanking = signal<RankingEntry[]>([]);
  globalRanking = signal<RankingEntry[]>([]);
  
  // Paginación para rankings
  private gameRankingPagination!: ReturnType<typeof this.paginationService.createPaginationState<RankingEntry>>;
  private globalRankingPagination!: ReturnType<typeof this.paginationService.createPaginationState<RankingEntry>>;
  
  // Paginación para partidas separadas por modo (ordenadas por tiempo)
  private singlePlayerMatchesPagination!: ReturnType<typeof this.paginationService.createPaginationState<GameMatch>>;
  private multiplayerMatchesPagination!: ReturnType<typeof this.paginationService.createPaginationState<GameMatch>>;
  
  currentUserId = signal<number | undefined>(undefined);
  Math = Math;

  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private paginationService: PaginationService
  ) {
    // Inicializar paginación en el constructor
    this.gameRankingPagination = this.paginationService.createPaginationState<RankingEntry>(6);
    this.globalRankingPagination = this.paginationService.createPaginationState<RankingEntry>(6);
    this.singlePlayerMatchesPagination = this.paginationService.createPaginationState<GameMatch>(6);
    this.multiplayerMatchesPagination = this.paginationService.createPaginationState<GameMatch>(6);
  }

  // Computed signals para obtener los datos paginados según la pestaña activa
  paginatedRanking = () => {
    if (this.activeTab() === 'game') {
      return this.gameRankingPagination.paginatedData();
    } else {
      return this.globalRankingPagination.paginatedData();
    }
  };

  // Computed signal para obtener partidas según la pestaña de modo activa
  paginatedMatches = () => {
    if (this.activeMatchTab() === 'single') {
      return this.singlePlayerMatchesPagination.paginatedData();
    } else {
      return this.multiplayerMatchesPagination.paginatedData();
    }
  };

  ngOnInit(): void {
    // Obtener ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId.set(currentUser?.id);
    
    this.loadData();
  }

  private loadData(): void {
    // Cargar ranking específico del juego
    this.statsService.getGameRanking().subscribe(data => {
      this.gameRanking.set(data);
      this.gameRankingPagination.setItems(data);
    });

    // Cargar ranking global
    this.statsService.getGlobalRanking().subscribe(data => {
      this.globalRanking.set(data);
      this.globalRankingPagination.setItems(data);
    });

    // Cargar historial de partidas separadas por modo y ordenadas por tiempo
    this.statsService.getMatchesByModeOrderedByTime(50).subscribe(matchesByMode => {
      this.singlePlayerMatchesPagination.setItems(matchesByMode.singlePlayer);
      this.multiplayerMatchesPagination.setItems(matchesByMode.multiplayer);
    });
  }

  setActiveTab(tab: 'game' | 'global' | 'matches'): void {
    this.activeTab.set(tab);
  }

  setActiveMatchTab(tab: 'single' | 'multi'): void {
    this.activeMatchTab.set(tab);
  }

  getCurrentRanking(): RankingEntry[] {
    return this.activeTab() === 'game' ? this.gameRanking() : this.globalRanking();
  }

  getTopThree(): RankingEntry[] {
    return this.getCurrentRanking().slice(0, 3);
  }

  getRankPosition(localIndex: number): number {
    const currentPage = this.paginatedRanking().pagination.currentPage;
    const itemsPerPage = this.paginatedRanking().pagination.itemsPerPage;
    return (currentPage - 1) * itemsPerPage + localIndex + 1;
  }

  getMedalEmoji(index: number): string {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[index] || '';
  }

  isCurrentUser(userId?: number): boolean {
    return userId === this.currentUserId();
  }

  onRankingPageChange(page: number): void {
    if (this.activeTab() === 'game') {
      this.gameRankingPagination.goToPage(page);
    } else {
      this.globalRankingPagination.goToPage(page);
    }
  }

  onMatchesPageChange(page: number): void {
    if (this.activeMatchTab() === 'single') {
      this.singlePlayerMatchesPagination.goToPage(page);
    } else {
      this.multiplayerMatchesPagination.goToPage(page);
    }
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

  getOpponentName(players: any[], currentPlayerId: number): string {
    const opponent = players.find(p => p.user.id !== currentPlayerId);
    return opponent?.user.name || 'Desconocido';
  }

  getBestTimeFromMatch(players: any[]): number {
    if (!players || players.length === 0) return 0;
    return Math.min(...players.map(p => p.tiempo || 0));
  }
}