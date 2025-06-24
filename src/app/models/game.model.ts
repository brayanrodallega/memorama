export interface Game {
  id?: number;
  titulo: string;
  autores: string;
  created_at?: string;
  updated_at?: string;
}

export interface Partida {
  id?: number;
  juego_id: string;
  fecha: string;
  tiempo?: number;
  nivel?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Acierto {
  id?: number;
  partida_id: number;
  user_id: number;
  aciertos: number;
  tiempo: number;
  created_at?: string;
  updated_at?: string;
  user?: any;
  partida?: Partida;
}

export interface CreatePartidaRequest {
  juego_id: string;
  fecha: string;
  tiempo?: number;
  nivel?: string;
}

export interface CreateAciertoRequest {
  partida_id: number;
  user_id: number;
  aciertos: number;
  tiempo: number;
} 