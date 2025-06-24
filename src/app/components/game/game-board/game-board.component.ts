import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MemoramaService } from '../../../services/memorama.service';
import { GameSession, Card, Player } from '../../../models/memorama.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements OnInit, OnDestroy {
  currentGame = signal<GameSession | null>(null);
  gameTime = signal<number>(0);
  isPaused = signal<boolean>(false);
  
  private gameSubscription?: Subscription;
  private timerSubscription?: Subscription;

  constructor(
    private memoramaService: MemoramaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGame();
    this.subscribeToGameUpdates();
    this.subscribeToTimer();
  }

  ngOnDestroy(): void {
    this.gameSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  private loadGame(): void {
    const game = this.memoramaService.getCurrentGame();
    if (game) {
      this.currentGame.set(game);
    } else {
      // Intentar cargar desde localStorage
      const savedGame = this.memoramaService.loadGameFromStorage();
      if (savedGame) {
        this.currentGame.set(savedGame);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  private subscribeToGameUpdates(): void {
    this.gameSubscription = this.memoramaService.currentGame$.subscribe(game => {
      this.currentGame.set(game);
    });
  }

  private subscribeToTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.gameTime.set(this.memoramaService.gameTime());
      this.isPaused.set(this.memoramaService.isPaused());
    });
  }

  getBoardCols(): number {
    const game = this.currentGame();
    if (!game) return 4;
    
    const cardCount = game.cards.length;
    if (cardCount <= 8) return 4;
    if (cardCount <= 12) return 4;
    return 4;
  }

  canFlipCard(): boolean {
    const game = this.currentGame();
    return game?.status === 'playing' && !this.isPaused() && 
           (game?.flippedCards?.length || 0) < 2;
  }

  flipCard(cardId: number): void {
    if (this.canFlipCard()) {
      this.memoramaService.flipCard(cardId);
    }
  }

  pauseGame(): void {
    if (this.isPaused()) {
      this.memoramaService.resumeGame();
    } else {
      this.memoramaService.pauseGame();
    }
  }

  resumeGame(): void {
    this.memoramaService.resumeGame();
  }

  resetGame(): void {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego?')) {
      this.memoramaService.resetGame();
    }
  }

  quitGame(): void {
    if (confirm('¿Estás seguro de que quieres salir del juego?')) {
      this.memoramaService.quitGame();
      this.router.navigate(['/']);
    }
  }

  playAgain(): void {
    this.memoramaService.resetGame();
  }

  goHome(): void {
    this.memoramaService.quitGame();
    this.router.navigate(['/']);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getPlayerMatches(): number {
    const game = this.currentGame();
    return game?.players[0]?.matches || 0;
  }

  getSortedPlayers(): Player[] {
    const players = this.currentGame()?.players || [];
    return [...players].sort((a, b) => b.matches - a.matches);
  }

  isTieGame(): boolean {
    const game = this.currentGame();
    if (!game || game.players.length < 2) return false;
    
    const maxScore = Math.max(...game.players.map(p => p.matches));
    const winnersCount = game.players.filter(p => p.matches === maxScore).length;
    return winnersCount > 1;
  }

  isTimeRunningOut(): boolean {
    const game = this.currentGame();
    if (!game?.config?.timeLimit || game.mode !== 'single') return false;
    
    const timeLeft = game.config.timeLimit - this.gameTime();
    return timeLeft <= 10 && timeLeft > 0; // Warning when 10 seconds or less
  }

  isTimeUp(): boolean {
    const game = this.currentGame();
    if (!game?.config?.timeLimit || game.mode !== 'single') return false;
    
    return this.gameTime() >= game.config.timeLimit;
  }
} 