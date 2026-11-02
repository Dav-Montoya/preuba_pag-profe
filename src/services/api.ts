const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const getHeaders = () => {
    const token = getStoredToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };


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
  // Challenge de Cognito: llega (sin tokens) cuando el usuario ingresó con
  // una contraseña temporal y debe definirla para activar su cuenta
  challengeName?: string;
  session?: string;
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

// Envelope estándar que devuelve el backend: { success, data, message, timestamp }
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  timestamp?: string;
}

// Obtener token de auth guardado
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('auth_token');
  // Un JWT válido tiene 3 partes (header.payload.signature);
  // si está corrupto ("undefined", vacío, etc.) lo descartamos de inmediato
  if (!token || token.split('.').length !== 3) {
    if (token) localStorage.removeItem('auth_token');
    return null;
  }
  return token;
};

// Guardar tokens: el accessToken viaja como Bearer; el idToken contiene los claims del usuario
const setAuthToken = (accessToken: string, idToken?: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', accessToken);
    if (idToken) {
      localStorage.setItem('auth_id_token', idToken);
    }
  }
};

// Remover token
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_id_token');
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
    console.log("Login")
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    // El backend envuelve la respuesta en ApiResponse: { success, data: { accessToken, ... }, message }
    const res: ApiResponse<AuthResponse> = await response.json();

    if (!response.ok || !res.success || !res.data) {
      // Nunca guardar un token inválido: hacerlo provocaba el 401 "Malformed token"
      removeAuthToken();
      throw new Error(res.message || 'No se pudo iniciar sesión');
    }

    // Usuario con contraseña temporal: el backend devuelve el challenge
    // NEW_PASSWORD_REQUIRED + session, sin tokens. Se propaga tal cual para
    // que la UI muestre el formulario de cambio de contraseña.
    if (res.data.challengeName && !res.data.accessToken) {
      removeAuthToken();
      return res.data;
    }

    if (!res.data.accessToken) {
      removeAuthToken();
      throw new Error(res.message || 'No se pudo iniciar sesión');
    }

    setAuthToken(res.data.accessToken, res.data.idToken);
    return res.data;
  },

  // Completar el cambio de contraseña obligatorio (primer login con contraseña temporal).
  // Al confirmar, el usuario queda activo en Cognito y ya puede usar la app.
  // "nombre" es necesario si el usuario fue creado sin el atributo obligatorio "name"
  async confirmarNuevaContrasena(
    email: string,
    session: string,
    nuevaContrasena: string,
    nombre: string,
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/nueva-contrasena`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, session, nuevaContrasena, nombre }),
    });

    const res: ApiResponse<AuthResponse> = await response.json();

    if (!response.ok || !res.success || !res.data?.accessToken) {
      throw new Error(res.message || 'No se pudo actualizar la contraseña');
    }

    setAuthToken(res.data.accessToken, res.data.idToken);
    return res.data;
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
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: await this.getHeaders(),
      });
    } finally {
      // Siempre limpiar el token local, aunque el backend falle
      removeAuthToken();
    }
  },

  // Verificar si hay sesión activa
  async checkSession(): Promise<boolean> {
    // Sin token válido no hay sesión. Ojo: /api/health es público, si llamamos
    // sin token la respuesta siempre sería OK y creeríamos que hay sesión.
    const token = getStoredToken();
    if (!token) return false;

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
    // Preferimos el idToken: el accessToken de Cognito no trae email ni nombre
    const idToken = localStorage.getItem('auth_id_token');
    const token = idToken || getStoredToken();
    if (!token) return null;

    try {
      // Decodificar el payload del JWT (segunda parte entre los puntos)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || '',
        email: payload.email || payload['cognito:username'] || '',
        nombre: payload.name || payload.given_name || payload.username || '',
        roles: payload['cognito:groups'] || payload.roles || [],
      };
    } catch {
      return null;
    }
  },
};

export default api;