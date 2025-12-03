/**
 * API d'Authentification
 * Gestion complète de l'authentification des utilisateurs
 */

import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

// =========================================================
// TYPES
// =========================================================

export interface AppUser {
  id: number;
  email: string;
  role: 'admin' | 'client' | 'staff';
  client_id?: number;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithClient extends AppUser {
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
}

export interface UserSession {
  id: string;
  user_id: number;
  token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: 'admin' | 'client' | 'staff';
  client_id?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: UserWithClient;
  session?: UserSession;
  error?: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: any;
  ip_address?: string;
  created_at: string;
}

// =========================================================
// UTILITAIRES
// =========================================================

/**
 * Générer un hash de mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifier un mot de passe
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Générer un token de session (simple UUID pour l'instant)
 */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Calculer la date d'expiration de session (7 jours par défaut)
 */
function getSessionExpiry(days: number = 7): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

// =========================================================
// AUTHENTIFICATION
// =========================================================

/**
 * Login utilisateur
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // 1. Récupérer l'utilisateur par email
    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      };
    }

    // 2. Vérifier si le compte est actif
    if (!user.is_active) {
      return {
        success: false,
        error: 'Compte désactivé. Contactez l\'administrateur.'
      };
    }

    // 3. Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(credentials.password, user.password_hash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      };
    }

    // 4. Mettre à jour last_login
    await supabase
      .from('app_user')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 5. Créer une session
    const token = generateSessionToken();
    const expiresAt = getSessionExpiry();

    const { data: session, error: sessionError } = await supabase
      .from('user_session')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Erreur création session:', sessionError);
      return {
        success: false,
        error: 'Erreur lors de la création de la session'
      };
    }

    // 6. Récupérer les infos enrichies (avec client si applicable)
    const { data: userWithClient } = await supabase
      .from('user_with_client')
      .select('*')
      .eq('id', user.id)
      .single();

    // 7. Logger l'activité
    await logActivity(user.id, 'login');

    return {
      success: true,
      user: userWithClient || user,
      session
    };

  } catch (error) {
    console.error('Erreur login:', error);
    return {
      success: false,
      error: 'Erreur lors de la connexion'
    };
  }
}

/**
 * Logout utilisateur
 */
export async function logout(sessionToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer l'user_id avant suppression pour logger
    const { data: session } = await supabase
      .from('user_session')
      .select('user_id')
      .eq('token', sessionToken)
      .single();

    // Supprimer la session
    const { error } = await supabase
      .from('user_session')
      .delete()
      .eq('token', sessionToken);

    if (error) {
      throw error;
    }

    // Logger l'activité
    if (session?.user_id) {
      await logActivity(session.user_id, 'logout');
    }

    return { success: true };

  } catch (error) {
    console.error('Erreur logout:', error);
    return {
      success: false,
      error: 'Erreur lors de la déconnexion'
    };
  }
}

/**
 * Vérifier une session
 */
export async function verifySession(token: string): Promise<AuthResponse> {
  try {
    // 1. Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('user_session')
      .select('*')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Session invalide'
      };
    }

    // 2. Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      // Session expirée, la supprimer
      await supabase
        .from('user_session')
        .delete()
        .eq('id', session.id);

      return {
        success: false,
        error: 'Session expirée'
      };
    }

    // 3. Récupérer l'utilisateur avec infos client
    const { data: user, error: userError } = await supabase
      .from('user_with_client')
      .select('*')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    // 4. Vérifier si le compte est actif
    if (!user.is_active) {
      return {
        success: false,
        error: 'Compte désactivé'
      };
    }

    return {
      success: true,
      user,
      session
    };

  } catch (error) {
    console.error('Erreur vérification session:', error);
    return {
      success: false,
      error: 'Erreur lors de la vérification'
    };
  }
}

/**
 * Enregistrer un nouvel utilisateur
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    // 1. Vérifier si l'email existe déjà
    const { data: existing } = await supabase
      .from('app_user')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existing) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé'
      };
    }

    // 2. Hasher le mot de passe
    const passwordHash = await hashPassword(data.password);

    // 3. Créer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('app_user')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        role: data.role || 'client',
        client_id: data.client_id,
        is_active: true
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('Erreur création utilisateur:', userError);
      return {
        success: false,
        error: 'Erreur lors de la création du compte'
      };
    }

    // 4. Logger l'activité
    await logActivity(user.id, 'register');

    // 5. Login automatique
    return login({
      email: data.email,
      password: data.password
    });

  } catch (error) {
    console.error('Erreur register:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'inscription'
    };
  }
}

// =========================================================
// GESTION UTILISATEURS
// =========================================================

/**
 * Récupérer un utilisateur par ID
 */
export async function getUserById(userId: number): Promise<UserWithClient | null> {
  try {
    const { data, error } = await supabase
      .from('user_with_client')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Erreur getUserById:', error);
    return null;
  }
}

/**
 * Récupérer tous les utilisateurs
 */
export async function getAllUsers(): Promise<UserWithClient[]> {
  try {
    const { data, error } = await supabase
      .from('user_with_client')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    return [];
  }
}

/**
 * Mettre à jour un utilisateur
 */
export async function updateUser(
  userId: number,
  updates: Partial<Omit<AppUser, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('app_user')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('Erreur updateUser:', error);
    return {
      success: false,
      error: 'Erreur lors de la mise à jour'
    };
  }
}

/**
 * Désactiver un utilisateur
 */
export async function deactivateUser(userId: number): Promise<{ success: boolean; error?: string }> {
  return updateUser(userId, { is_active: false });
}

/**
 * Activer un utilisateur
 */
export async function activateUser(userId: number): Promise<{ success: boolean; error?: string }> {
  return updateUser(userId, { is_active: true });
}

/**
 * Changer le mot de passe
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('app_user')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    // 2. Vérifier l'ancien mot de passe
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Mot de passe actuel incorrect'
      };
    }

    // 3. Hasher le nouveau mot de passe
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Mettre à jour
    const { error: updateError } = await supabase
      .from('app_user')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 5. Logger l'activité
    await logActivity(userId, 'change_password');

    return { success: true };

  } catch (error) {
    console.error('Erreur changePassword:', error);
    return {
      success: false,
      error: 'Erreur lors du changement de mot de passe'
    };
  }
}

// =========================================================
// ACTIVITÉ & LOGS
// =========================================================

/**
 * Logger une activité utilisateur
 */
export async function logActivity(
  userId: number,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: any
): Promise<void> {
  try {
    await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
      });
  } catch (error) {
    console.error('Erreur logActivity:', error);
  }
}

/**
 * Récupérer les logs d'activité d'un utilisateur
 */
export async function getUserActivity(
  userId: number,
  limit: number = 50
): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Erreur getUserActivity:', error);
    return [];
  }
}

// =========================================================
// NETTOYAGE
// =========================================================

/**
 * Nettoyer les sessions expirées
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_expired_sessions');

    if (error) throw error;
    return data || 0;

  } catch (error) {
    console.error('Erreur cleanupExpiredSessions:', error);
    return 0;
  }
}

// =========================================================
// PERMISSIONS
// =========================================================

/**
 * Vérifier si un utilisateur a les permissions
 */
export async function checkPermission(
  userId: number,
  requiredRole: 'admin' | 'client' | 'staff'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('check_user_permission', {
        p_user_id: userId,
        p_required_role: requiredRole
      });

    if (error) throw error;
    return data || false;

  } catch (error) {
    console.error('Erreur checkPermission:', error);
    return false;
  }
}

/**
 * Vérifier si un utilisateur est admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  return checkPermission(userId, 'admin');
}

/**
 * Vérifier si un utilisateur peut accéder à un client
 */
export async function canAccessClient(userId: number, clientId: number): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    
    if (!user) return false;
    
    // Admin peut accéder à tous les clients
    if (user.role === 'admin') return true;
    
    // Client ne peut accéder qu'à son propre compte
    if (user.role === 'client') {
      return user.client_id === clientId;
    }
    
    return false;

  } catch (error) {
    console.error('Erreur canAccessClient:', error);
    return false;
  }
}
