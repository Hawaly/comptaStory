"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface CalendarPost {
  id: string;
  date: string; // YYYY-MM-DD
  platform: string;
  contentType: string;
  title: string;
  description?: string;
  status?: 'draft' | 'scheduled' | 'published';
}

interface EditorialCalendarProps {
  posts: CalendarPost[];
  onPostsChange: (posts: CalendarPost[]) => void;
  platforms: string[];
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Instagram: { bg: 'bg-pink-100', text: 'text-pink-700' },
  Facebook: { bg: 'bg-blue-100', text: 'text-blue-700' },
  LinkedIn: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  TikTok: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Twitter: { bg: 'bg-sky-100', text: 'text-sky-700' },
  YouTube: { bg: 'bg-red-100', text: 'text-red-700' },
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function EditorialCalendar({ posts, onPostsChange, platforms }: EditorialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

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
    return posts.filter(post => post.date === dateStr);
  };

  // Ajouter un post
  const handleAddPost = (date: string) => {
    setSelectedDate(date);
    setEditingPost(null);
    setShowAddModal(true);
  };

  // Éditer un post
  const handleEditPost = (post: CalendarPost) => {
    setEditingPost(post);
    setSelectedDate(post.date);
    setShowAddModal(true);
  };

  // Supprimer un post
  const handleDeletePost = (postId: string) => {
    onPostsChange(posts.filter(p => p.id !== postId));
  };

  // Sauvegarder un post (nouveau ou édité)
  const handleSavePost = (post: CalendarPost) => {
    if (editingPost) {
      // Édition
      onPostsChange(posts.map(p => p.id === post.id ? post : p));
    } else {
      // Nouveau
      onPostsChange([...posts, post]);
    }
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
                    </div>
                    <button
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

  return (
    <div className="space-y-4">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-elegant border-2 border-gray-100">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="text-lg font-bold text-gray-900">
          {MONTHS[currentMonth]} {currentYear}
        </h3>

        <button
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
          {platforms.map(platform => {
            const colors = PLATFORM_COLORS[platform] || { bg: 'bg-gray-100', text: 'text-gray-700' };
            return (
              <div key={platform} className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-semibold`}>
                {platform}
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
          platforms={platforms}
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
  post: CalendarPost | null;
  date: string;
  platforms: string[];
  onSave: (post: CalendarPost) => void;
  onClose: () => void;
}

function PostModal({ post, date, platforms, onSave, onClose }: PostModalProps) {
  const [formData, setFormData] = useState<CalendarPost>(
    post || {
      id: Date.now().toString(),
      date,
      platform: platforms[0] || '',
      contentType: '',
      title: '',
      description: '',
      status: 'draft',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.platform) {
      onSave(formData);
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
      <div className="bg-white rounded-2xl shadow-brand-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {post ? 'Éditer' : 'Nouveau'} Post
              </h3>
              <p className="text-sm text-gray-600 mt-1 capitalize">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            >
              <option value="">Sélectionner une plateforme</option>
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
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Ex: Carrousel, Reel, Story, Article..."
            />
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Titre / Sujet *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Sujet du post..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Description / Notes
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
              placeholder="Détails, hashtags, mentions, liens..."
            />
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
            >
              <option value="draft">Brouillon</option>
              <option value="scheduled">Programmé</option>
              <option value="published">Publié</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {post ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
