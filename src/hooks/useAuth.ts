import { useEffect, useState, useCallback } from 'react';
import api, { type User, type AuthResponse } from '../services/api';

// Info mínima para completar el cambio de contraseña obligatorio
export interface PendingChallenge {
  email: string;
  session: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingChallenge: PendingChallenge | null;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse | null>;
  completarNuevaContrasena: (nuevaContrasena: string, nombre: string) => Promise<void>;
  cancelarCambioContrasena: () => void;
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
  const [pendingChallenge, setPendingChallenge] = useState<PendingChallenge | null>(null);

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
  }): Promise<AuthResponse | null> => {
    setIsLoading(true);
    try {
      const result = await api.login(credentials);
      if (result && result.accessToken) {
        const currentUser = api.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        return result;
      }
      // Contraseña temporal: queda pendiente que el usuario defina la nueva
      if (result?.challengeName === 'NEW_PASSWORD_REQUIRED' && result.session) {
        setPendingChallenge({ email: credentials.email, session: result.session });
        return result;
      }
      return null;
    } catch {
      // Credenciales inválidas u otro error: no guardar nada ni marcar sesión
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Activa el usuario confirmando el cambio de contraseña obligatorio.
  // "nombre" completa el atributo obligatorio "name" si el usuario fue creado sin él
  const completarNuevaContrasena = useCallback(async (nuevaContrasena: string, nombre: string): Promise<void> => {
    if (!pendingChallenge) {
      return;
    }
    setIsLoading(true);
    try {
      await api.confirmarNuevaContrasena(
        pendingChallenge.email,
        pendingChallenge.session,
        nuevaContrasena,
        nombre,
      );
      const currentUser = api.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      setPendingChallenge(null);
    } finally {
      setIsLoading(false);
    }
  }, [pendingChallenge]);

  // Cancelar el cambio de contraseña pendiente y volver al login
  const cancelarCambioContrasena = useCallback(() => {
    setPendingChallenge(null);
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
      await api.register(credentials);
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
      setPendingChallenge(null);
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
    pendingChallenge,
    login,
    completarNuevaContrasena,
    cancelarCambioContrasena,
    register,
    logout,
    checkSession,
  };
};

export default useAuth;