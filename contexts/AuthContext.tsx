"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserWithClient, LoginCredentials, RegisterData, AuthResponse } from '@/lib/authApi';
import { login as apiLogin, logout as apiLogout, register as apiRegister, verifySession } from '@/lib/authApi';

// =========================================================
// TYPES
// =========================================================

interface AuthContextType {
  user: UserWithClient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  refreshUser: () => Promise<void>;
}

// =========================================================
// CONTEXT
// =========================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =========================================================
// PROVIDER
// =========================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Vérifier la session au chargement
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Vérifier si une session existe
   */
  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      const response = await verifySession(sessionToken);

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        // Session invalide, nettoyer
        localStorage.removeItem('session_token');
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
      localStorage.removeItem('session_token');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login utilisateur
   */
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiLogin(credentials);

      if (response.success && response.user && response.session) {
        setUser(response.user);
        localStorage.setItem('session_token', response.session.token);
        
        // Rediriger selon le rôle
        if (response.user.role === 'admin') {
          router.push('/dashboard');
        } else if (response.user.role === 'client') {
          router.push('/client-portal');
        }
      }

      return response;
    } catch (error) {
      console.error('Erreur login:', error);
      return {
        success: false,
        error: 'Erreur lors de la connexion'
      };
    }
  };

  /**
   * Logout utilisateur
   */
  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      if (sessionToken) {
        await apiLogout(sessionToken);
      }

      setUser(null);
      localStorage.removeItem('session_token');
      router.push('/login');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  /**
   * Enregistrer un nouvel utilisateur
   */
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiRegister(data);

      if (response.success && response.user && response.session) {
        setUser(response.user);
        localStorage.setItem('session_token', response.session.token);
        
        // Rediriger selon le rôle
        if (response.user.role === 'client') {
          router.push('/client-portal');
        } else {
          router.push('/dashboard');
        }
      }

      return response;
    } catch (error) {
      console.error('Erreur register:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'inscription'
      };
    }
  };

  /**
   * Rafraîchir les données utilisateur
   */
  const refreshUser = async () => {
    const sessionToken = localStorage.getItem('session_token');
    
    if (!sessionToken) {
      setUser(null);
      return;
    }

    const response = await verifySession(sessionToken);

    if (response.success && response.user) {
      setUser(response.user);
    } else {
      setUser(null);
      localStorage.removeItem('session_token');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// =========================================================
// HOOKS UTILITAIRES
// =========================================================

/**
 * Hook pour protéger une page (admin seulement)
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

/**
 * Hook pour protéger une page admin
 */
export function useRequireAdmin(redirectTo: string = '/login') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo);
      } else if (user.role !== 'admin') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

/**
 * Hook pour protéger une page client
 */
export function useRequireClient(redirectTo: string = '/login') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo);
      } else if (user.role !== 'client') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}
