import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MemoramaService } from '../../../services/memorama.service';
import { GAME_LEVELS } from '../../../models/memorama.model';
import { Player } from '../../../models/memorama.model';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './game-setup.component.html',
  styleUrl: './game-setup.component.scss'
})
export class GameSetupComponent implements OnInit {
  setupForm: FormGroup;
  gameMode = signal<'single' | 'multiplayer'>('single');
  selectedLevel = signal<'facil' | 'medio' | 'dificil'>('facil');
  secondPlayerFound = signal<any>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  Math = Math;

  levels = [
    {
      key: 'facil' as const,
      name: 'Fácil',
      icon: '🟢',
      description: 'Perfecto para principiantes',
      config: GAME_LEVELS['facil']
    },
    {
      key: 'medio' as const,
      name: 'Medio',
      icon: '🟡',
      description: 'Un desafío moderado',
      config: GAME_LEVELS['medio']
    },
    {
      key: 'dificil' as const,
      name: 'Difícil',
      icon: '🔴',
      description: 'Para expertos en memoria',
      config: GAME_LEVELS['dificil']
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private memoramaService: MemoramaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.setupForm = this.fb.group({
      secondPlayerEmail: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'] as 'single' | 'multiplayer';
      this.gameMode.set(mode || 'single');
      
      if (mode === 'multiplayer') {
        this.setupForm.get('secondPlayerEmail')?.setValidators([Validators.required, Validators.email]);
        this.setupForm.get('secondPlayerEmail')?.updateValueAndValidity();
      }
    });

    // Buscar segundo jugador cuando se escriba el email
    this.setupForm.get('secondPlayerEmail')?.valueChanges.subscribe(email => {
      if (email && this.setupForm.get('secondPlayerEmail')?.valid) {
        this.searchSecondPlayer(email);
      } else {
        this.secondPlayerFound.set(null);
      }
    });
  }

  selectLevel(level: 'facil' | 'medio' | 'dificil'): void {
    this.selectedLevel.set(level);
  }

  getLevelName(level: string): string {
    const levelData = this.levels.find(l => l.key === level);
    return levelData?.name || '';
  }

  getSelectedLevelConfig() {
    return GAME_LEVELS[this.selectedLevel()] || null;
  }

  private searchSecondPlayer(email: string): void {
    this.authService.getUserByEmail(email).subscribe({
      next: (user) => {
        if (user) {
          const currentUser = this.authService.getCurrentUser();
          if (user.email === currentUser?.email) {
            this.secondPlayerFound.set(null);
            this.setupForm.get('secondPlayerEmail')?.setErrors({ sameUser: true });
          } else {
            this.secondPlayerFound.set(user);
            this.setupForm.get('secondPlayerEmail')?.setErrors(null);
          }
        } else {
          this.secondPlayerFound.set(null);
          this.setupForm.get('secondPlayerEmail')?.setErrors({ userNotFound: true });
        }
      },
      error: () => {
        this.secondPlayerFound.set(null);
      }
    });
  }

  canStartGame(): boolean {
    if (this.gameMode() === 'single') {
      return true;
    } else {
      return this.setupForm.valid && this.secondPlayerFound() !== null;
    }
  }

  startGame(): void {
    if (!this.canStartGame()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage.set('Usuario no autenticado');
      this.isLoading.set(false);
      return;
    }

    const players: Player[] = [
      {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        score: 0,
        matches: 0,
        isCurrentPlayer: true
      }
    ];

    if (this.gameMode() === 'multiplayer' && this.secondPlayerFound()) {
      const secondPlayer = this.secondPlayerFound();
      players.push({
        id: secondPlayer.id,
        name: secondPlayer.name,
        email: secondPlayer.email,
        score: 0,
        matches: 0,
        isCurrentPlayer: false
      });
    }

    try {
      const game = this.memoramaService.createNewGame(
        this.gameMode(),
        this.selectedLevel(),
        players
      );

      this.isLoading.set(false);
      this.router.navigate(['/game/play']);
    } catch (error) {
      this.isLoading.set(false);
      this.errorMessage.set('Error al iniciar el juego');
    }
  }
} 