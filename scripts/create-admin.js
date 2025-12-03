const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
  console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    console.log('🔐 Création de l\'utilisateur admin...');
    
    // Mot de passe simple pour les tests
    const password = 'admin123';
    const email = 'admin@yourstory.ch';
    
    // Générer le hash du mot de passe
    console.log('🔒 Hashage du mot de passe...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Hash généré:', passwordHash);
    
    // Supprimer l'ancien admin si existant
    console.log('🗑️  Suppression de l\'ancien admin si existant...');
    const { error: deleteError } = await supabase
      .from('app_user')
      .delete()
      .eq('email', email);
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Erreur lors de la suppression:', deleteError);
    }
    
    // Créer le nouvel utilisateur admin
    console.log('➕ Création du nouvel admin...');
    const { data, error } = await supabase
      .from('app_user')
      .insert([
        {
          email: email,
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('❌ Erreur lors de la création:', error);
      return;
    }
    
    console.log('✅ Utilisateur admin créé avec succès!');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('👤 Données:', data);
    
    // Vérifier que l'utilisateur peut être récupéré
    console.log('\n🔍 Vérification...');
    const { data: checkData, error: checkError } = await supabase
      .from('app_user')
      .select('id, email, role, is_active')
      .eq('email', email)
      .single();
    
    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
    } else {
      console.log('✅ Utilisateur vérifié:', checkData);
    }
    
    console.log('\n========================================');
    console.log('✅ SUCCÈS: Admin créé!');
    console.log('========================================');
    console.log('Connectez-vous avec:');
    console.log('  Email:', email);
    console.log('  Mot de passe:', password);
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la fonction
createAdmin();
