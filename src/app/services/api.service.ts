import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User, RegisterRequest } from '../models/user.model';
import { Game, Partida, Acierto, CreatePartidaRequest, CreateAciertoRequest } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'https://apigame.gonzaloandreslucio.com/api';
  private readonly gameId = '5cdca5a2-e5f8-4e5c-8cd0-5d17b5c76b8f';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // Métodos de Usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  createUser(user: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, { ...user, juego_id: this.gameId }, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Métodos de Juegos
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.baseUrl}/juegos`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getGameById(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.baseUrl}/juegos/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Métodos de Partidas
  getPartidas(): Observable<Partida[]> {
    return this.http.get<Partida[]>(`${this.baseUrl}/partidas`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPartidaById(id: number): Observable<Partida> {
    return this.http.get<Partida>(`${this.baseUrl}/partidas/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  createPartida(partida: CreatePartidaRequest): Observable<Partida> {
    return this.http.post<Partida>(`${this.baseUrl}/partidas`, partida, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePartida(id: number, partida: Partial<CreatePartidaRequest>): Observable<Partida> {
    return this.http.put<Partida>(`${this.baseUrl}/partidas/${id}`, partida, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Métodos de Aciertos
  getAciertos(): Observable<Acierto[]> {
    return this.http.get<Acierto[]>(`${this.baseUrl}/aciertos`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAciertoById(id: number): Observable<Acierto> {
    return this.http.get<Acierto>(`${this.baseUrl}/aciertos/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAciertosByPartida(partidaId: number): Observable<Acierto[]> {
    return this.http.get<Acierto[]>(`${this.baseUrl}/aciertos/partida/${partidaId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAciertosByUser(userId: number): Observable<Acierto[]> {
    return this.http.get<Acierto[]>(`${this.baseUrl}/aciertos/usuario/${userId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAciertoByUserAndPartida(userId: number, partidaId: number): Observable<Acierto> {
    return this.http.get<Acierto>(`${this.baseUrl}/aciertos/usuario/${userId}/partida/${partidaId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  createAcierto(acierto: CreateAciertoRequest): Observable<Acierto> {
    return this.http.post<Acierto>(`${this.baseUrl}/aciertos`, acierto, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateAcierto(id: number, acierto: Partial<CreateAciertoRequest>): Observable<Acierto> {
    return this.http.put<Acierto>(`${this.baseUrl}/aciertos/${id}`, acierto, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Métodos de utilidad
  getUserByEmail(email: string): Observable<User | null> {
    return new Observable(observer => {
      this.getUsers().subscribe(users => {
        const user = users.find(u => u.email === email && u.juego_id === this.gameId);
        observer.next(user || null);
        observer.complete();
      }, error => observer.error(error));
    });
  }

  getGameId(): string {
    return this.gameId;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
} 