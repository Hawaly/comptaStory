import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DÉBUT LOGIN ===');
    
    // Récupération des données
    const body = await request.json();
    const { username, password } = body;
    
    console.log('Email reçu:', username);
    console.log('Password reçu:', password ? '***' : 'vide');

    // Validation
    if (!username || !password) {
      console.log('❌ Champs manquants');
      return NextResponse.json(
        { error: 'Email et password sont requis' },
        { status: 400 }
      );
    }

    // Test connection Supabase
    console.log('🔍 Test connection Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('app_user')
      .select('count');
    
    console.log('Test Supabase:', testError ? testError : `✅ ${testData?.length || 0} rows`);

    // Recherche utilisateur
    console.log('🔍 Recherche utilisateur avec email:', username);
    
    const { data: users, error: dbError } = await supabase
      .from('app_user')
      .select('id, email, password_hash, role, is_active')
      .eq('email', username)
      .eq('is_active', true)
      .limit(1);

    console.log('Résultat requête:', {
      error: dbError,
      userCount: users?.length || 0,
      user: users?.[0] ? {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        hasHash: !!users[0].password_hash
      } : null
    });

    // Erreur DB
    if (dbError) {
      console.error('❌ Erreur Supabase:', dbError);
      return NextResponse.json(
        { error: 'Erreur base de données: ' + dbError.message },
        { status: 500 }
      );
    }

    // Utilisateur existe ?
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      );
    }

    const user = users[0];
    console.log('✅ Utilisateur trouvé:', user.email);

    // Vérification mot de passe
    console.log('🔒 Vérification mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Mot de passe valide:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Création session
    console.log('🔐 Création session...');
    await createSession({
      userId: String(user.id),
      username: user.email,
    });
    console.log('✅ Session créée');

    // Succès
    console.log('=== LOGIN RÉUSSI ===');
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
