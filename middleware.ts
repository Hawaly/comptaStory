import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Routes publiques (accessibles sans authentification)
const PUBLIC_ROUTES = ['/login', '/hash-password'];

// Routes API publiques
const PUBLIC_API_ROUTES = ['/api/login', '/api/hash-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route publique
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));

  // Ne pas protéger les routes publiques et les assets
  if (isPublicRoute || isPublicApiRoute || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Récupérer le cookie de session
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Si pas de cookie, rediriger vers login
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier la validité du token
  const session = await verifyToken(sessionCookie.value);

  // Si le token est invalide, rediriger vers login
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    // Supprimer le cookie invalide
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Vérifier si c'est une route dashboard (admin uniquement)
  const isDashboardRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/clients') || 
                           pathname.startsWith('/factures') || 
                           pathname.startsWith('/mandats') || 
                           pathname.startsWith('/depenses') || 
                           pathname.startsWith('/settings') || 
                           pathname.startsWith('/taches');

  // Vérifier si l'utilisateur est admin (role_id = 1)
  const isAdmin = session.roleId === 1;

  // Si route dashboard et pas admin (role_id !== 1), rediriger vers client-portal
  if (isDashboardRoute && !isAdmin) {
    const clientPortalUrl = new URL('/client-portal', request.url);
    return NextResponse.redirect(clientPortalUrl);
  }

  // Si route client-portal et admin (role_id === 1), rediriger vers dashboard
  if (pathname.startsWith('/client-portal') && isAdmin) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Si l'utilisateur est authentifié et essaie d'accéder à /login, rediriger selon le role_id
  if (pathname === '/login') {
    if (isAdmin) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    } else {
      const clientPortalUrl = new URL('/client-portal', request.url);
      return NextResponse.redirect(clientPortalUrl);
    }
  }

  // Utilisateur authentifié avec les bonnes permissions, continuer
  return NextResponse.next();
}

// Configuration du matcher pour appliquer le middleware
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - API routes (api/)
     * - Static files (_next/static)
     * - Image optimization files (_next/image)
     * - Favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


