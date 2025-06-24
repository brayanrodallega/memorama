import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Card, GameSession, Player, GameConfig, GAME_LEVELS } from '../models/memorama.model';
import { CreatePartidaRequest, CreateAciertoRequest } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class MemoramaService {
  private currentGameSubject = new BehaviorSubject<GameSession | null>(null);
  public currentGame$ = this.currentGameSubject.asObservable();

  // Signals para el estado del juego
  public isGameActive = signal<boolean>(false);
  public currentGame = signal<GameSession | null>(null);
  public gameTime = signal<number>(0);
  public isPaused = signal<boolean>(false);

  private gameTimer: any;
  private cardImages = [
    '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
    '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'
  ];

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  createNewGame(mode: 'single' | 'multiplayer', level: 'facil' | 'medio' | 'dificil', players: Player[]): GameSession {
    const levelConfig = GAME_LEVELS[level];
    const cards = this.generateCards(levelConfig.cardCount);
    
    // Solo aplicar límite de tiempo para modo individual
    const timeLimit = mode === 'single' ? levelConfig.timeLimit : undefined;
    
    const game: GameSession = {
      id: this.generateGameId(),
      mode,
      level,
      config: {
        ...levelConfig,
        timeLimit: timeLimit // Solo establecer timeLimit para single player
      },
      players: players.map((player, index) => ({
        ...player,
        isCurrentPlayer: index === 0
      })),
      cards,
      currentPlayerIndex: 0,
      flippedCards: [],
      moves: 0,
      status: 'playing',
      startTime: new Date()
    };

    this.currentGameSubject.next(game);
    this.currentGame.set(game);
    this.isGameActive.set(true);
    this.startTimer();
    this.saveGameToStorage(game);

    return game;
  }

  flipCard(cardId: number): void {
    const game = this.currentGameSubject.value;
    if (!game || game.status !== 'playing' || game.flippedCards.length >= 2) {
      return;
    }

    const card = game.cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) {
      return;
    }

    card.isFlipped = true;
    game.flippedCards.push(card);

    if (game.flippedCards.length === 2) {
      game.moves++;
      setTimeout(() => this.checkMatch(), 1000);
    }

    this.updateGame(game);
  }

  private checkMatch(): void {
    const game = this.currentGameSubject.value;
    if (!game || game.flippedCards.length !== 2) return;

    const [card1, card2] = game.flippedCards;
    
    if (card1.value === card2.value) {
      // Match encontrado
      card1.isMatched = true;
      card2.isMatched = true;
      
      // Incrementar puntuación del jugador actual
      const currentPlayer = game.players[game.currentPlayerIndex];
      currentPlayer.score += 10;
      currentPlayer.matches++;
      
    } else {
      // No hay match, voltear cartas
      card1.isFlipped = false;
      card2.isFlipped = false;
      
      // Cambiar de jugador si es modo multijugador
      if (game.mode === 'multiplayer') {
        this.nextPlayer(game);
      }
    }

    game.flippedCards = [];
    
    // Verificar si el juego ha terminado
    if (this.checkGameComplete(game)) {
      this.endGame(game);
    } else {
      this.updateGame(game);
    }
  }

  private nextPlayer(game: GameSession): void {
    // Desactivar jugador actual
    game.players[game.currentPlayerIndex].isCurrentPlayer = false;
    
    // Activar siguiente jugador
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.players[game.currentPlayerIndex].isCurrentPlayer = true;
  }

  private checkGameComplete(game: GameSession): boolean {
    return game.cards.every(card => card.isMatched);
  }

  private async endGame(game: GameSession): Promise<void> {
    game.status = 'finished';
    game.endTime = new Date();
    this.stopTimer();
    this.isGameActive.set(false);

    // Determinar resultado del juego y asignar a cada jugador
    const maxScore = Math.max(...game.players.map(p => p.matches));
    const winnersCount = game.players.filter(p => p.matches === maxScore).length;
    const isTie = winnersCount > 1 && game.players.length > 1;

    // Asignar resultado a cada jugador
    game.players.forEach(player => {
      const hasMaxScore = player.matches === maxScore;
      if (hasMaxScore && isTie) {
        player.gameResult = 'tie';
      } else if (hasMaxScore && !isTie) {
        player.gameResult = 'win';
      } else {
        player.gameResult = 'lose';
      }
    });

    try {
      // Obtener el game ID correcto del usuario actual
      const currentUser = this.authService.currentUser();
      const gameId = currentUser?.juego_id || this.apiService.getGameId();
      
      // Crear partida en la API
      const partidaData: CreatePartidaRequest = {
        juego_id: gameId,
        fecha: new Date().toISOString().split('T')[0],
        tiempo: this.gameTime(),
        nivel: game.level
      };

      const partida = await this.apiService.createPartida(partidaData).toPromise();
      
      if (partida?.id) {
        // Crear registros de aciertos para cada jugador
        for (const player of game.players) {
          if (player.id) {
            const aciertoData: CreateAciertoRequest = {
              partida_id: partida.id,
              user_id: player.id,
              aciertos: player.matches,
              tiempo: this.gameTime()
            };
            
            await this.apiService.createAcierto(aciertoData).toPromise();
          }
        }
      }
    } catch (error) {
      console.error('Error guardando resultados:', error);
    }

    this.updateGame(game);
    this.saveGameToStorage(game);
  }

  private async endGameByTimeLimit(game: GameSession): Promise<void> {
    // Terminar juego por límite de tiempo alcanzado
    await this.endGame(game);
  }

  private generateCards(cardCount: number): Card[] {
    const pairCount = cardCount / 2;
    const selectedImages = this.cardImages.slice(0, pairCount);
    const cards: Card[] = [];

    // Crear pares de cartas
    selectedImages.forEach((image, index) => {
      cards.push({
        id: index * 2,
        imageUrl: image,
        isFlipped: false,
        isMatched: false,
        value: image
      });
      cards.push({
        id: index * 2 + 1,
        imageUrl: image,
        isFlipped: false,
        isMatched: false,
        value: image
      });
    });

    // Mezclar cartas
    return this.shuffleArray(cards);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateGameId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private startTimer(): void {
    this.gameTime.set(0);
    this.gameTimer = setInterval(() => {
      if (!this.isPaused()) {
        this.gameTime.update(time => {
          const newTime = time + 1;
          
          // Verificar límite de tiempo solo para modo individual
          const currentGame = this.currentGameSubject.value;
          if (currentGame?.mode === 'single' && 
              currentGame?.config?.timeLimit && 
              newTime >= currentGame.config.timeLimit) {
            // Tiempo agotado - terminar juego
            this.endGameByTimeLimit(currentGame);
            return newTime;
          }
          
          return newTime;
        });
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  pauseGame(): void {
    this.isPaused.set(true);
  }

  resumeGame(): void {
    this.isPaused.set(false);
  }

  resetGame(): void {
    const game = this.currentGameSubject.value;
    if (!game) return;

    // Reiniciar cartas
    game.cards.forEach(card => {
      card.isFlipped = false;
      card.isMatched = false;
    });

    // Reiniciar jugadores
    game.players.forEach((player, index) => {
      player.score = 0;
      player.matches = 0;
      player.isCurrentPlayer = index === 0;
    });

    // Reiniciar estado del juego
    game.currentPlayerIndex = 0;
    game.flippedCards = [];
    game.moves = 0;
    game.status = 'playing';
    game.startTime = new Date();
    delete game.endTime;

    // Mezclar cartas
    game.cards = this.shuffleArray(game.cards);

    this.gameTime.set(0);
    this.startTimer();
    this.updateGame(game);
  }

  private updateGame(game: GameSession): void {
    this.currentGameSubject.next(game);
    this.currentGame.set(game);
    this.saveGameToStorage(game);
  }

  private saveGameToStorage(game: GameSession): void {
    if (this.isBrowser) {
      localStorage.setItem('memorama_current_game', JSON.stringify(game));
    }
  }

  loadGameFromStorage(): GameSession | null {
    if (!this.isBrowser) {
      return null;
    }
    
    const stored = localStorage.getItem('memorama_current_game');
    if (stored) {
      const game = JSON.parse(stored);
      this.currentGameSubject.next(game);
      this.currentGame.set(game);
      return game;
    }
    return null;
  }

  getCurrentGame(): GameSession | null {
    return this.currentGameSubject.value;
  }

  quitGame(): void {
    this.stopTimer();
    this.isGameActive.set(false);
    this.currentGameSubject.next(null);
    this.currentGame.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('memorama_current_game');
    }
  }
} 