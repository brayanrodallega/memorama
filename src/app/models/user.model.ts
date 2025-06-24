export interface User {
  id?: number;
  juego_id?: string;
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  juego_id: string;
} 