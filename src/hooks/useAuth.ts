import { useEffect, useState, useCallback } from 'react';
import api, { type User } from '../services/api';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<import('../services/api').AuthResponse | null>;
  register: (credentials: {
    email: string;
    password: string;
    nombre: string;
    roles: string[];
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar sesión al iniciar
  const loadSession = useCallback(async () => {
    setIsLoading(true);

    // Verificar si hay token guardado
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Verificar sesión con el backend
    const isValid = await api.checkSession();
    setIsAuthenticated(isValid);

    if (isValid) {
      const currentUser = api.getCurrentUser();
      setUser(currentUser);
    }

    setIsLoading(false);
  }, []);

  // Login de usuario
  const login = useCallback(async (credentials: {
    email: string;
    password: string;
  }): Promise<import('../services/api').AuthResponse | null> => {
    setIsLoading(true);
    try {
      const result = await api.login(credentials);
      if (result && result.accessToken) {
        const currentUser = api.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        return result;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registro de nuevo usuario
  const register = useCallback(async (credentials: {
    email: string;
    password: string;
    nombre: string;
    roles: string[];
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await api.register(credentials);
      // Después de registro, podríamos hacer login automático o solo mostrar mensaje
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar sesión
  const checkSession = useCallback(async (): Promise<boolean> => {
    const isValid = await api.checkSession();
    setIsAuthenticated(isValid);
    return isValid;
  }, []);

  // Efecto para cargar sesión al montar
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkSession,
  };
};

export default useAuth;