import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface User {
  id: string;
  email: string;
  nombre: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  nombre: string;
  roles: string[];
}

// Obtener token de auth guardado
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Guardar token
const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

// Remover token
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

const api = {
  // HEADERS configurados con el token si existe
  async getHeaders(): Promise<HeadersInit> {
    const token = getStoredToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },

  // Autenticación
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    const res = await response.json();
    setAuthToken(res.accessToken);
    return res;
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: await this.getHeaders(),
    });
    removeAuthToken();
    if (!response.ok) {
      removeAuthToken();
    }
  },

  // Verificar si hay sesión activa
  async checkSession(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: await this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Obtener usuario actual desde el token decodificado
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const token = getStoredToken();
    if (!token) return null;

    try {
      // Decodificar el payload del JWT (segunda parte entre los puntos)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || '',
        email: payload.email || '',
        nombre: payload.name || '',
        roles: payload.roles || [],
      };
    } catch {
      return null;
    }
  },
};

export default api;