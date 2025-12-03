"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// =========================================================
// TYPES
// =========================================================

interface User {
  id: number;
  email: string;
  role_code: string;
  role_name: string;
  role_id: number; // 1 = admin, 2 = client, 3 = staff
  client_id?: number;
  client_name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

// =========================================================
// CONTEXT
// =========================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =========================================================
// PROVIDER
// =========================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Vérifier la session au chargement
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Vérifier si une session existe (via cookie HTTP-only)
   */
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login utilisateur
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        
        // Rediriger selon le rôle
        const redirectPath = data.redirect_path || '/dashboard';
        router.push(redirectPath);
        
        return { success: true };
      }

      return { 
        success: false, 
        error: data.error || 'Erreur de connexion' 
      };
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
      await fetch('/api/logout', {
        method: 'POST',
      });

      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkSession,
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
 * Protège une page - redirige si non authentifié
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isAuthenticated };
}

/**
 * Protège une page admin - redirige si non admin (role_id !== 1)
 */
export function useRequireAdmin() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role_id !== 1) {
        // Vérifier role_id === 1 pour admin
        router.push('/client-portal');
      }
    }
  }, [user, isLoading, router]);

  return { isLoading, user };
}

/**
 * Protège une page client - redirige si non client (role_id !== 2)
 */
export function useRequireClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role_id !== 2) {
        // Vérifier role_id === 2 pour client
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return { isLoading, user };
}
