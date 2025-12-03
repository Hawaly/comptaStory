import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Récupération des données du formulaire
    const body = await request.json();
    const { username, password } = body;

    // Validation des champs
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Email et password sont requis' },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur avec son rôle
    // Utilise la vue user_with_details pour obtenir toutes les infos
    const { data: users, error: dbError } = await supabase
      .from('user_with_details')
      .select('user_id, email, role_id, role_code, role_name, redirect_path, client_id, client_name, is_active')
      .eq('email', username)
      .eq('is_active', true)
      .limit(1);
    
    // Si la vue n'existe pas, utiliser une jointure manuelle
    if (dbError && dbError.message.includes('does not exist')) {
      const { data: usersJoin, error: joinError } = await supabase
        .from('app_user')
        .select(`
          id,
          email,
          password_hash,
          is_active,
          client_id,
          role:role_id (
            id,
            code,
            name,
            redirect_path
          )
        `)
        .eq('email', username)
        .eq('is_active', true)
        .limit(1);
      
      if (joinError) {
        console.error('Erreur Supabase (jointure):', joinError);
        return NextResponse.json(
          { error: 'Erreur lors de la connexion à la base de données' },
          { status: 500 }
        );
      }
      
      // Adapter les données pour correspondre au format attendu
      if (usersJoin && usersJoin.length > 0) {
        const userData = usersJoin[0];
        // Récupérer aussi le hash du mot de passe
        const { data: hashData } = await supabase
          .from('app_user')
          .select('password_hash')
          .eq('id', userData.id)
          .single();
        
        return NextResponse.json({
          success: true,
          user: {
            id: userData.id,
            email: userData.email,
            role_code: (userData.role as any)?.code,
            role_name: (userData.role as any)?.name,
            client_id: userData.client_id,
          },
          redirect_path: (userData.role as any)?.redirect_path || '/dashboard'
        });
      }
    }

    // Gestion des erreurs de base de données
    if (dbError) {
      console.error('Erreur Supabase:', dbError);
      return NextResponse.json(
        { error: 'Erreur lors de la connexion à la base de données' },
        { status: 500 }
      );
    }

    // Vérification si l'utilisateur existe
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Récupérer le password_hash depuis app_user (la vue ne le contient pas)
    const { data: authData, error: authError } = await supabase
      .from('app_user')
      .select('password_hash')
      .eq('id', user.user_id)
      .single();

    if (authError || !authData) {
      console.error('Erreur récupération password_hash:', authError);
      return NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 500 }
      );
    }

    // Comparaison du mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, authData.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Création de la session avec le rôle et role_id
    await createSession({
      userId: String(user.user_id), // Utiliser user_id de la vue
      username: user.email,
      role: user.role_code, // Ajouter le rôle dans la session
      roleId: user.role_id, // Ajouter le role_id pour vérification (1 = admin)
    });

    // Réponse de succès avec redirection
    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        role_code: user.role_code,
        role_name: user.role_name,
        role_id: user.role_id, // Ajouter role_id
        client_id: user.client_id,
        client_name: user.client_name,
      },
      redirect_path: user.redirect_path, // Chemin de redirection selon le rôle
    });

  } catch (error) {
    console.error('Erreur lors du login:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la connexion' },
      { status: 500 }
    );
  }
}


