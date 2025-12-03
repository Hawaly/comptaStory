import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Récupérer la session depuis le cookie
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Récupérer les infos complètes de l'utilisateur
    const { data: userData, error } = await supabase
      .from('user_with_details')
      .select('user_id, email, role_id, role_code, role_name, redirect_path, client_id, client_name, is_active')
      .eq('user_id', parseInt(session.userId))
      .eq('is_active', true)
      .single();

    if (error || !userData) {
      console.error('Erreur récupération user:', error);
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: userData.user_id,
        email: userData.email,
        role_code: userData.role_code,
        role_name: userData.role_name,
        role_id: userData.role_id, // Ajouter role_id
        client_id: userData.client_id,
        client_name: userData.client_name,
      },
    });
  } catch (error) {
    console.error('Erreur session:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
