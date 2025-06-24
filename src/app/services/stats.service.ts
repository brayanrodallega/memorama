import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { ApiService } from './api.service';
import { Acierto, Partida } from '../models/game.model';
import { User } from '../models/user.model';

export interface RankingEntry {
  user: User;
  totalMatches: number;
  totalGames: number;
  averageTime: number;
  bestTime: number;
  winRate: number;
}

export interface GameMatch {
  partida: Partida;
  players: {
    user: User;
    aciertos: number;
    tiempo: number;
    isWinner: boolean;
    isTie: boolean;
  }[];
  result: 'winner' | 'tie';
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private apiService: ApiService) {}

  getGlobalRanking(): Observable<RankingEntry[]> {
    return combineLatest([
      this.apiService.getUsers(),
      this.apiService.getAciertos(),
      this.apiService.getPartidas()
    ]).pipe(
      map(([users, aciertos, partidas]) => {
        return this.calculateRanking(users, aciertos, partidas);
      })
    );
  }

  getGameSpecificRanking(): Observable<RankingEntry[]> {
    const gameId = this.apiService.getGameId();
    
    return combineLatest([
      this.apiService.getUsers(),
      this.apiService.getAciertos(),
      this.apiService.getPartidas()
    ]).pipe(
      map(([users, aciertos, partidas]) => {
        // Filtrar usuarios por nuestro juego
        const gameUsers = users.filter(user => user.juego_id === gameId);
        return this.calculateRanking(gameUsers, aciertos, partidas);
      })
    );
  }

  getGameRanking(): Observable<RankingEntry[]> {
    return this.getGameSpecificRanking();
  }

  getUserStats(userId: number): Observable<RankingEntry | null> {
    return combineLatest([
      this.apiService.getUserById(userId),
      this.apiService.getAciertosByUser(userId),
      this.apiService.getPartidas()
    ]).pipe(
      map(([user, userAciertos, partidas]) => {
        if (!user) return null;
        
        const userRanking = this.calculateRanking([user], userAciertos, partidas);
        return userRanking.length > 0 ? userRanking[0] : null;
      })
    );
  }

  getGameMatches(): Observable<GameMatch[]> {
    return combineLatest([
      this.apiService.getPartidas(),
      this.apiService.getAciertos(),
      this.apiService.getUsers()
    ]).pipe(
      map(([partidas, aciertos, users]) => {
        const gameId = this.apiService.getGameId();
        const gameUsers = users.filter(user => user.juego_id === gameId);
        
        // Filtrar partidas que pertenecen al juego específico
        const gamePartidas = partidas.filter(partida => partida.juego_id === gameId);
        
        return gamePartidas.map(partida => {
          // Obtener aciertos para esta partida
          const partidaAciertos = aciertos.filter(a => a.partida_id === partida.id);
          
          // Crear información de jugadores
          const players = partidaAciertos.map(acierto => {
            const user = gameUsers.find(u => u.id === acierto.user_id);
            return {
              user: user!,
              aciertos: acierto.aciertos,
              tiempo: acierto.tiempo,
              isWinner: false,
              isTie: false
            };
          }).filter(p => p.user); // Filtrar jugadores válidos
          
          // Determinar ganador(es) y empates
          if (players.length > 0) {
            const maxMatches = Math.max(...players.map(p => p.aciertos));
            const winnersCount = players.filter(p => p.aciertos === maxMatches).length;
            
            // Si hay más de un jugador con la puntuación máxima, es empate
            const isTie = winnersCount > 1 && players.length > 1;
            
            players.forEach(player => {
              const hasMaxScore = player.aciertos === maxMatches;
              player.isWinner = hasMaxScore && !isTie;
              player.isTie = hasMaxScore && isTie;
            });
          }
          
          // Determinar resultado general del juego
          const maxMatches = Math.max(...players.map(p => p.aciertos));
          const winnersCount = players.filter(p => p.aciertos === maxMatches).length;
          const gameResult: 'winner' | 'tie' = winnersCount > 1 && players.length > 1 ? 'tie' : 'winner';

          return {
            partida,
            players,
            result: gameResult
          };
        }).filter(match => match.players.length > 0 && match.players.some(p => p.user)); // Solo partidas con jugadores válidos del juego
      })
    );
  }

  getRecentMatches(limit: number = 10): Observable<GameMatch[]> {
    return this.getGameMatches().pipe(
      map(matches => {
        return matches
          .sort((a, b) => {
            const dateA = a.partida.created_at ? new Date(a.partida.created_at).getTime() : new Date(a.partida.fecha).getTime();
            const dateB = b.partida.created_at ? new Date(b.partida.created_at).getTime() : new Date(b.partida.fecha).getTime();
            return dateB - dateA;
          })
          .slice(0, limit);
      })
    );
  }

  // Obtener partidas separadas por modo y ordenadas por fecha (más recientes primero)
  getMatchesByModeOrderedByDate(limit: number = 50): Observable<{singlePlayer: GameMatch[], multiplayer: GameMatch[]}> {
    return this.getGameMatches().pipe(
      map(matches => {
        // Ordenar TODAS las partidas por created_at descendente (más recientes primero)
        const allMatchesSorted = matches.sort((a, b) => {
          const dateA = a.partida.created_at ? new Date(a.partida.created_at).getTime() : new Date(a.partida.fecha).getTime();
          const dateB = b.partida.created_at ? new Date(b.partida.created_at).getTime() : new Date(b.partida.fecha).getTime();
          return dateB - dateA;
        });

        // Separar por modo de juego DESPUÉS del ordenamiento global
        const singlePlayer = allMatchesSorted
          .filter(match => match.players.length === 1)
          .slice(0, limit);
        
        const multiplayer = allMatchesSorted
          .filter(match => match.players.length > 1)
          .slice(0, limit);

        return { singlePlayer, multiplayer };
      })
    );
  }

  // Obtener partidas separadas por modo y ordenadas por tiempo (mejores tiempos primero)
  getMatchesByModeOrderedByTime(limit: number = 50): Observable<{singlePlayer: GameMatch[], multiplayer: GameMatch[]}> {
    return this.getGameMatches().pipe(
      map(matches => {
        // Separar por modo de juego primero
        const singlePlayerMatches = matches.filter(match => match.players.length === 1);
        const multiplayerMatches = matches.filter(match => match.players.length > 1);

        // Ordenar partidas individuales por tiempo del jugador (menor tiempo = mejor)
        const singlePlayer = singlePlayerMatches
          .sort((a, b) => a.players[0].tiempo - b.players[0].tiempo)
          .slice(0, limit);

        // Ordenar partidas multijugador por el mejor tiempo entre los jugadores
        const multiplayer = multiplayerMatches
          .sort((a, b) => {
            const bestTimeA = Math.min(...a.players.map(p => p.tiempo));
            const bestTimeB = Math.min(...b.players.map(p => p.tiempo));
            return bestTimeA - bestTimeB;
          })
          .slice(0, limit);

        return { singlePlayer, multiplayer };
      })
    );
  }

  private calculateRanking(users: User[], aciertos: Acierto[], partidas: Partida[]): RankingEntry[] {
    // Agrupar aciertos por email del usuario (identificador único para sumar todos los aciertos)
    const userStatsMap = new Map<string, {
      user: User;
      totalMatches: number;
      totalGames: number;
      totalTime: number;
      gameWins: number;
      bestTime: number;
    }>();

    // Procesar aciertos agrupando por email
    aciertos.forEach(acierto => {
      const user = users.find(u => u.id === acierto.user_id);
      if (!user?.email) return;
      
      const userEmail = user.email;
      const existing = userStatsMap.get(userEmail);
      
      if (existing) {
        existing.totalMatches += acierto.aciertos;
        existing.totalGames += 1;
        existing.totalTime += acierto.tiempo;
        if (acierto.tiempo < existing.bestTime) {
          existing.bestTime = acierto.tiempo;
        }
      } else {
        userStatsMap.set(userEmail, {
          user: user,
          totalMatches: acierto.aciertos,
          totalGames: 1,
          totalTime: acierto.tiempo,
          gameWins: 0,
          bestTime: acierto.tiempo
        });
      }
    });

    // Determinar ganadores por partida
    const partidasMap = new Map<number, any[]>();
    aciertos.forEach(acierto => {
      const partidaId = acierto.partida_id;
      if (!partidasMap.has(partidaId)) {
        partidasMap.set(partidaId, []);
      }
      partidasMap.get(partidaId)?.push(acierto);
    });

    // Calcular victorias (solo contar como victoria si ganó sin empate)
    partidasMap.forEach(partidaAciertos => {
      if (partidaAciertos.length === 0) return;
      
      // Encontrar el máximo de aciertos en esta partida
      const maxAciertos = Math.max(...partidaAciertos.map(a => a.aciertos));
      const ganadores = partidaAciertos.filter(a => a.aciertos === maxAciertos);
      
      // Solo si hay un ganador claro (no empate), incrementar sus victorias
      if (ganadores.length === 1) {
        const ganador = ganadores[0];
        const user = users.find(u => u.id === ganador.user_id);
        if (user?.email && userStatsMap.has(user.email)) {
          userStatsMap.get(user.email)!.gameWins += 1;
        }
      }
      // Si hay empate (múltiples ganadores), no incrementar victorias para nadie
    });

    // Convertir a array y calcular estadísticas finales
    const ranking: RankingEntry[] = Array.from(userStatsMap.values()).map(stats => ({
      user: stats.user,
      totalMatches: stats.totalMatches,
      totalGames: stats.totalGames,
      winRate: stats.totalGames > 0 ? (stats.gameWins / stats.totalGames) * 100 : 0,
      averageTime: stats.totalGames > 0 ? stats.totalTime / stats.totalGames : 0,
      bestTime: stats.bestTime
    }));

    // Ordenar por total de aciertos primero, luego por tasa de victoria
    ranking.sort((a, b) => {
      if (a.totalMatches !== b.totalMatches) {
        return b.totalMatches - a.totalMatches;
      }
      return b.winRate - a.winRate;
    });

    return ranking;
  }

  getTopPlayers(limit: number = 5): Observable<RankingEntry[]> {
    return this.getGameSpecificRanking().pipe(
      map(ranking => ranking.slice(0, limit))
    );
  }

  getGlobalStats(): Observable<any> {
    return combineLatest([
      this.apiService.getUsers(),
      this.apiService.getAciertos(),
      this.apiService.getPartidas()
    ]).pipe(
      map(([users, aciertos, partidas]) => {
        const gameId = this.apiService.getGameId();
        const gameUsers = users.filter(user => user.juego_id === gameId);
        const gameAciertos = aciertos.filter(a => 
          gameUsers.some(u => u.id === a.user_id)
        );
        
        return {
          totalPlayers: gameUsers.length,
          totalGames: gameAciertos.length,
          totalMatches: gameAciertos.reduce((sum, a) => sum + a.aciertos, 0),
          averageMatchesPerGame: gameAciertos.length > 0 ? 
            gameAciertos.reduce((sum, a) => sum + a.aciertos, 0) / gameAciertos.length : 0
        };
      })
    );
  }


} 