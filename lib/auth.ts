import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Récupère la clé secrète JWT
 * Lève une erreur si elle n'est pas définie
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be defined in environment variables');
  }
  return secret;
}

// Durée de validité du token (7 jours)
const JWT_EXPIRATION = '7d';

// Nom du cookie de session
export const SESSION_COOKIE_NAME = 'session';

// Type pour les données du token
export interface SessionData {
  userId: string;
  username: string;
  role?: string; // Role code de l'utilisateur (admin, client, staff)
  roleId?: number; // Role ID (1 = admin, 2 = client, 3 = staff)
}

/**
 * Crée un JWT signé avec les données de l'utilisateur
 */
export async function createToken(data: SessionData): Promise<string> {
  const secret = new TextEncoder().encode(getJWTSecret());
  
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret);
  
  return token;
}

/**
 * Vérifie et décode un JWT
 */
export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const secret = new TextEncoder().encode(getJWTSecret());
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as string | undefined,
      roleId: payload.roleId as number | undefined,
    };
  } catch {
    // Token invalide ou expiré
    return null;
  }
}

/**
 * Crée un cookie de session avec le token JWT
 */
export async function createSession(sessionData: SessionData): Promise<void> {
  const token = await createToken(sessionData);
  const cookieStore = await cookies();
  
  // Cookie HttpOnly, Secure en production
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours en secondes
    path: '/',
  });
}

/**
 * Récupère la session actuelle depuis le cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  return await verifyToken(sessionCookie.value);
}

/**
 * Supprime le cookie de session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

