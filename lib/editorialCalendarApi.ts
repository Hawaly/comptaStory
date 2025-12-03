import { supabase } from './supabaseClient';
import { EditorialCalendar, EditorialPost, EditorialPostInsert, EditorialPostUpdate } from '@/types/database';

// =========================================================
// CALENDRIER ÉDITORIAL
// =========================================================

/**
 * Récupère le calendrier éditorial d'une stratégie
 * (créé automatiquement par trigger lors de la création de la stratégie)
 */
export async function getEditorialCalendar(strategyId: number): Promise<EditorialCalendar | null> {
  const { data, error } = await supabase
    .from('editorial_calendar')
    .select('*')
    .eq('strategy_id', strategyId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du calendrier:', error);
    return null;
  }

  return data as EditorialCalendar;
}

/**
 * Crée un calendrier éditorial pour une stratégie
 * (normalement créé automatiquement, mais utile si besoin)
 */
export async function createEditorialCalendar(strategyId: number, name?: string): Promise<EditorialCalendar | null> {
  const { data, error } = await supabase
    .from('editorial_calendar')
    .insert({
      strategy_id: strategyId,
      name: name || `Calendrier éditorial - Stratégie ${strategyId}`,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du calendrier:', error);
    return null;
  }

  return data as EditorialCalendar;
}

// =========================================================
// POSTS
// =========================================================

/**
 * Récupère tous les posts d'un calendrier
 */
export async function getCalendarPosts(calendarId: number): Promise<EditorialPost[]> {
  const { data, error } = await supabase
    .from('editorial_post')
    .select('*')
    .eq('calendar_id', calendarId)
    .order('publication_date', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    return [];
  }

  return data as EditorialPost[];
}

/**
 * Récupère les posts d'un calendrier pour une période donnée
 */
export async function getCalendarPostsByDateRange(
  calendarId: number,
  startDate: string,
  endDate: string
): Promise<EditorialPost[]> {
  const { data, error } = await supabase
    .from('editorial_post')
    .select('*')
    .eq('calendar_id', calendarId)
    .gte('publication_date', startDate)
    .lte('publication_date', endDate)
    .order('publication_date', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des posts par période:', error);
    return [];
  }

  return data as EditorialPost[];
}

/**
 * Récupère un post par son ID
 */
export async function getPost(postId: number): Promise<EditorialPost | null> {
  const { data, error } = await supabase
    .from('editorial_post')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du post:', error);
    return null;
  }

  return data as EditorialPost;
}

/**
 * Crée un nouveau post
 */
export async function createPost(post: EditorialPostInsert): Promise<EditorialPost | null> {
  const { data, error } = await supabase
    .from('editorial_post')
    .insert({
      calendar_id: post.calendar_id,
      publication_date: post.publication_date,
      platform: post.platform,
      content_type: post.content_type || null,
      title: post.title,
      description: post.description || null,
      caption: post.caption || null,
      hashtags: post.hashtags || null,
      mentions: post.mentions || null,
      media_urls: post.media_urls || null,
      status: post.status || 'draft',
      scheduled_time: post.scheduled_time || null,
      published_at: post.published_at || null,
      engagement_rate: post.engagement_rate || null,
      notes: post.notes || null,
      created_by: post.created_by || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du post:', error);
    return null;
  }

  return data as EditorialPost;
}

/**
 * Met à jour un post existant
 */
export async function updatePost(postId: number, updates: EditorialPostUpdate): Promise<EditorialPost | null> {
  const { data, error } = await supabase
    .from('editorial_post')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    return null;
  }

  return data as EditorialPost;
}

/**
 * Supprime un post
 */
export async function deletePost(postId: number): Promise<boolean> {
  const { error } = await supabase
    .from('editorial_post')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Erreur lors de la suppression du post:', error);
    return false;
  }

  return true;
}

/**
 * Duplique un post (copie avec nouvelle date)
 */
export async function duplicatePost(postId: number, newDate: string): Promise<EditorialPost | null> {
  const originalPost = await getPost(postId);
  if (!originalPost) {
    return null;
  }

  const newPost: EditorialPostInsert = {
    calendar_id: originalPost.calendar_id,
    publication_date: newDate,
    platform: originalPost.platform,
    content_type: originalPost.content_type,
    title: `${originalPost.title} (copie)`,
    description: originalPost.description,
    caption: originalPost.caption,
    hashtags: originalPost.hashtags,
    mentions: originalPost.mentions,
    media_urls: originalPost.media_urls,
    status: 'draft',
    scheduled_time: originalPost.scheduled_time,
    published_at: null,
    engagement_rate: null,
    notes: originalPost.notes,
    created_by: originalPost.created_by,
  };

  return await createPost(newPost);
}

// =========================================================
// STATISTIQUES
// =========================================================

/**
 * Récupère les statistiques d'un calendrier
 */
export async function getCalendarStatistics(calendarId: number) {
  const posts = await getCalendarPosts(calendarId);

  const stats = {
    total: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    cancelled: posts.filter(p => p.status === 'cancelled').length,
    
    // Métriques (posts publiés uniquement)
    totalLikes: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.likes, 0),
    totalComments: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.comments, 0),
    totalShares: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.shares, 0),
    totalViews: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.views, 0),
    totalReach: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.reach, 0),
    
    // Engagement moyen
    avgEngagementRate: posts
      .filter(p => p.status === 'published' && p.engagement_rate)
      .reduce((sum, p, _, arr) => sum + (p.engagement_rate || 0) / arr.length, 0),
    
    // Par plateforme
    byPlatform: posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return stats;
}

/**
 * Récupère les posts à publier aujourd'hui
 */
export async function getTodaysPosts(calendarId: number): Promise<EditorialPost[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('editorial_post')
    .select('*')
    .eq('calendar_id', calendarId)
    .eq('publication_date', today)
    .in('status', ['draft', 'scheduled'])
    .order('scheduled_time', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des posts du jour:', error);
    return [];
  }

  return data as EditorialPost[];
}

/**
 * Récupère les posts en retard (date passée mais pas publiés)
 */
export async function getOverduePosts(calendarId: number): Promise<EditorialPost[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('editorial_post')
    .select('*')
    .eq('calendar_id', calendarId)
    .lt('publication_date', today)
    .in('status', ['draft', 'scheduled'])
    .order('publication_date', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des posts en retard:', error);
    return [];
  }

  return data as EditorialPost[];
}

/**
 * Marque un post comme publié
 */
export async function markPostAsPublished(postId: number): Promise<EditorialPost | null> {
  return await updatePost(postId, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}
