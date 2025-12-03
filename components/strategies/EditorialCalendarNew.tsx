"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditorialPost, EditorialPostInsert } from '@/types/database';
import {
  getCalendarPosts,
  createPost,
  updatePost,
  deletePost,
  getCalendarStatistics,
} from '@/lib/editorialCalendarApi';

interface EditorialCalendarNewProps {
  calendarId: number;
  platforms?: string[];
}

// Plateformes par défaut si aucune n'est définie
const DEFAULT_PLATFORMS = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'TikTok',
  'Twitter/X',
  'YouTube',
  'Pinterest'
];

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Instagram: { bg: 'bg-pink-100', text: 'text-pink-700' },
  Facebook: { bg: 'bg-blue-100', text: 'text-blue-700' },
  LinkedIn: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  TikTok: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Twitter: { bg: 'bg-sky-100', text: 'text-sky-700' },
  'Twitter/X': { bg: 'bg-sky-100', text: 'text-sky-700' },
  YouTube: { bg: 'bg-red-100', text: 'text-red-700' },
  Pinterest: { bg: 'bg-red-100', text: 'text-red-700' },
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function EditorialCalendarNew({ calendarId, platforms }: EditorialCalendarNewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<EditorialPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Utiliser les plateformes fournies ou les plateformes par défaut
  const availablePlatforms = (platforms && platforms.length > 0) ? platforms : DEFAULT_PLATFORMS;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Charger les posts du calendrier
  useEffect(() => {
    loadPosts();
    loadStats();
  }, [calendarId, currentMonth, currentYear]);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await getCalendarPosts(calendarId);
    setPosts(data);
    setIsLoading(false);
  };

  const loadStats = async () => {
    const statistics = await getCalendarStatistics(calendarId);
    setStats(statistics);
  };

  // Obtenir les jours du mois
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Premier jour du mois (0 = dimanche)
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convertir pour que lundi = 0
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Naviguer entre les mois
  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  // Obtenir les posts pour une date donnée
  const getPostsForDate = (dateStr: string) => {
    return posts.filter(post => post.publication_date === dateStr);
  };

  // Ajouter un post
  const handleAddPost = (date: string) => {
    setSelectedDate(date);
    setEditingPost(null);
    setShowAddModal(true);
  };

  // Éditer un post
  const handleEditPost = (post: EditorialPost) => {
    setEditingPost(post);
    setSelectedDate(post.publication_date);
    setShowAddModal(true);
  };

  // Supprimer un post
  const handleDeletePost = async (postId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      const success = await deletePost(postId);
      if (success) {
        await loadPosts();
        await loadStats();
      }
    }
  };

  // Sauvegarder un post (nouveau ou édité)
  const handleSavePost = async (post: EditorialPost | EditorialPostInsert) => {
    if ('id' in post) {
      // Édition
      await updatePost(post.id, post);
    } else {
      // Nouveau
      await createPost(post);
    }
    await loadPosts();
    await loadStats();
    setShowAddModal(false);
    setEditingPost(null);
  };

  // Rendre les jours du calendrier
  const renderCalendarDays = () => {
    const days = [];
    
    // Jours vides avant le premier jour du mois
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50 border border-gray-200" />
      );
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = getPostsForDate(dateStr);
      const isToday = new Date().toDateString() === new Date(dateStr).toDateString();

      days.push(
        <div
          key={day}
          className={`min-h-[100px] border border-gray-200 p-2 bg-white hover:bg-gray-50 transition-colors ${
            isToday ? 'ring-2 ring-brand-orange' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${isToday ? 'text-brand-orange' : 'text-gray-700'}`}>
              {day}
            </span>
            <button
              type="button"
              onClick={() => handleAddPost(dateStr)}
              className="p-1 hover:bg-brand-orange/10 rounded-lg transition-colors group"
              title="Ajouter un post"
            >
              <Plus className="w-3 h-3 text-gray-400 group-hover:text-brand-orange" />
            </button>
          </div>

          <div className="space-y-1">
            {dayPosts.map((post) => {
              const colors = PLATFORM_COLORS[post.platform] || { bg: 'bg-gray-100', text: 'text-gray-700' };
              return (
                <div
                  key={post.id}
                  className={`${colors.bg} p-1.5 rounded text-xs cursor-pointer hover:shadow-md transition-shadow group`}
                  onClick={() => handleEditPost(post)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className={`${colors.text} font-semibold truncate text-[10px]`}>
                        {post.platform}
                      </p>
                      <p className="text-gray-700 truncate text-[11px]">
                        {post.title}
                      </p>
                      {post.status === 'published' && (
                        <span className="text-green-600 text-[9px]">✓ Publié</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-gray-500 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
            <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
            <p className="text-xs text-gray-600 uppercase font-bold mb-1">Brouillon</p>
            <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
            <p className="text-xs text-orange-600 uppercase font-bold mb-1">Programmés</p>
            <p className="text-2xl font-bold text-orange-600">{stats.scheduled}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
            <p className="text-xs text-green-600 uppercase font-bold mb-1">Publiés</p>
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
            <p className="text-xs text-red-600 uppercase font-bold mb-1">Annulés</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>
      )}

      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
        <button
          type="button"
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="text-lg font-bold text-gray-900">
          {MONTHS[currentMonth]} {currentYear}
        </h3>

        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="bg-white rounded-xl shadow-elegant border-2 border-gray-100 overflow-hidden">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAYS.map(day => (
            <div key={day} className="p-2 text-center">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
        <p className="text-sm font-bold text-gray-700 mb-3">Plateformes :</p>
        <div className="flex flex-wrap gap-2">
          {availablePlatforms.map(platform => {
            const colors = PLATFORM_COLORS[platform] || { bg: 'bg-gray-100', text: 'text-gray-700' };
            const count = stats?.byPlatform[platform] || 0;
            return (
              <div key={platform} className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2`}>
                <span>{platform}</span>
                <span className="bg-white/50 px-1.5 rounded-full">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal d'ajout/édition */}
      {showAddModal && selectedDate && (
        <PostModal
          post={editingPost}
          date={selectedDate}
          calendarId={calendarId}
          platforms={availablePlatforms}
          onSave={handleSavePost}
          onClose={() => {
            setShowAddModal(false);
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
}

// Modal pour ajouter/éditer un post
interface PostModalProps {
  post: EditorialPost | null;
  date: string;
  calendarId: number;
  platforms: string[];
  onSave: (post: EditorialPost | EditorialPostInsert) => Promise<void>;
  onClose: () => void;
}

function PostModal({ post, date, calendarId, platforms, onSave, onClose }: PostModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<EditorialPost>>({
    calendar_id: calendarId,
    publication_date: date,
    platform: post?.platform || platforms[0] || '',
    content_type: post?.content_type || '',
    title: post?.title || '',
    description: post?.description || '',
    caption: post?.caption || '',
    hashtags: post?.hashtags || [],
    mentions: post?.mentions || [],
    status: post?.status || 'draft',
    notes: post?.notes || '',
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.platform) {
      alert('Le titre et la plateforme sont obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      if (post) {
        // Édition
        await onSave({ ...post, ...formData } as EditorialPost);
      } else {
        // Nouveau
        await onSave(formData as EditorialPostInsert);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-brand-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {post ? 'Éditer' : 'Nouveau'} Post
              </h3>
              <p className="text-sm text-gray-600 mt-1 capitalize">{formattedDate}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Plateforme */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Plateforme *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
                required
                disabled={isSaving}
              >
                <option value="">Sélectionner...</option>
                {platforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Type de contenu */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Type de contenu
              </label>
              <input
                type="text"
                value={formData.content_type || ''}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
                placeholder="Carrousel, Reel, Story..."
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Titre / Sujet *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Sujet du post..."
              required
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Description courte
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Résumé du post..."
              disabled={isSaving}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Caption / Texte du post
            </label>
            <textarea
              value={formData.caption || ''}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Texte complet du post..."
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Hashtags */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Hashtags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={formData.hashtags?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value.split(',').map(h => h.trim()) })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
                placeholder="#hashtag1, #hashtag2"
                disabled={isSaving}
              />
            </div>

            {/* Mentions */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Mentions (séparées par des virgules)
              </label>
              <input
                type="text"
                value={formData.mentions?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, mentions: e.target.value.split(',').map(m => m.trim()) })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
                placeholder="@mention1, @mention2"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              disabled={isSaving}
            >
              <option value="draft">Brouillon</option>
              <option value="scheduled">Programmé</option>
              <option value="published">Publié</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Notes internes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Notes pour l'équipe..."
              disabled={isSaving}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              isLoading={isSaving}
              onClick={async () => {
                await handleSubmit();
              }}
            >
              {post ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
