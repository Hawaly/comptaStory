"use client";

import { useState, useEffect } from "react";
import { 
  SocialMediaStrategy, 
  SocialMediaStrategyInsert,
  SOCIAL_PLATFORMS,
  CONTENT_FORMATS,
  StrategyStatus,
  STRATEGY_STATUS_LABELS
} from "@/types/database";
import { 
  Loader2, 
  Check, 
  ChevronRight,
  Save,
  X,
  Target,
  Users,
  MessageSquare,
  Layers,
  Calendar,
  TrendingUp,
  DollarSign,
  Settings,
  FileText
} from "lucide-react";
import { EditorialCalendarNew } from "./EditorialCalendarNew";
import { PersonaManager } from "./PersonaManager";
import { PilierManager } from "./PilierManager";
import { KPIManager } from "./KPIManager";
import { KPIDashboard } from "./KPIDashboard";
import { Button } from "@/components/ui/Button";
import { getEditorialCalendar } from "@/lib/editorialCalendarApi";
import type { EditorialCalendar as EditorialCalendarType } from "@/types/database";

interface ModernStrategyFormProps {
  clientId: number;
  strategy?: SocialMediaStrategy | null;
  onSave: (strategy: Partial<SocialMediaStrategyInsert>) => Promise<void>;
  onCancel: () => void;
}

// Définition des sections avec icônes et couleurs
const SECTIONS = [
  { id: 'contexte', title: 'Contexte & Objectifs', icon: Target, color: 'orange' },
  { id: 'audience', title: 'Audience & Personas', icon: Users, color: 'blue' },
  { id: 'positionnement', title: 'Positionnement', icon: MessageSquare, color: 'purple' },
  { id: 'piliers', title: 'Piliers de Contenu', icon: Layers, color: 'green' },
  { id: 'formats', title: 'Formats & Rythme', icon: Calendar, color: 'pink' },
  { id: 'audit', title: 'Audit & Benchmark', icon: TrendingUp, color: 'indigo' },
  { id: 'kpis', title: 'KPIs & Suivi', icon: TrendingUp, color: 'red' },
  { id: 'peso', title: 'PESO Model', icon: DollarSign, color: 'yellow' },
  { id: 'budget', title: 'Budget & Ressources', icon: DollarSign, color: 'teal' },
  { id: 'planning', title: 'Planning & Calendrier', icon: Calendar, color: 'orange' },
];

export function ModernStrategyForm({ clientId, strategy, onSave, onCancel }: ModernStrategyFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [calendar, setCalendar] = useState<EditorialCalendarType | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  
  const [formData, setFormData] = useState<Partial<SocialMediaStrategyInsert>>({
    client_id: clientId,
    status: 'brouillon',
    contexte_general: '',
    objectifs_business: '',
    objectifs_reseaux: '',
    cibles: '',
    plateformes: [],
    ton_voix: '',
    guidelines_visuelles: '',
    valeurs_messages: '',
    formats_envisages: [],
    frequence_calendrier: '',
    workflow_roles: '',
    audit_profils: '',
    benchmark_concurrents: '',
    cadre_suivi: '',
    owned_media: '',
    shared_media: '',
    paid_media: '',
    earned_media: '',
    temps_humain: '',
    outils: '',
    budget_pub: '',
    planning_global: '',
    processus_iteration: '',
    mise_a_jour: '',
    notes_internes: '',
  });

  useEffect(() => {
    if (strategy) {
      setFormData({
        client_id: strategy.client_id,
        status: strategy.status,
        contexte_general: strategy.contexte_general || '',
        objectifs_business: strategy.objectifs_business || '',
        objectifs_reseaux: strategy.objectifs_reseaux || '',
        cibles: strategy.cibles || '',
        plateformes: strategy.plateformes || [],
        ton_voix: strategy.ton_voix || '',
        guidelines_visuelles: strategy.guidelines_visuelles || '',
        valeurs_messages: strategy.valeurs_messages || '',
        formats_envisages: strategy.formats_envisages || [],
        frequence_calendrier: strategy.frequence_calendrier || '',
        workflow_roles: strategy.workflow_roles || '',
        audit_profils: strategy.audit_profils || '',
        benchmark_concurrents: strategy.benchmark_concurrents || '',
        cadre_suivi: strategy.cadre_suivi || '',
        owned_media: strategy.owned_media || '',
        shared_media: strategy.shared_media || '',
        paid_media: strategy.paid_media || '',
        earned_media: strategy.earned_media || '',
        temps_humain: strategy.temps_humain || '',
        outils: strategy.outils || '',
        budget_pub: strategy.budget_pub || '',
        planning_global: strategy.planning_global || '',
        processus_iteration: strategy.processus_iteration || '',
        mise_a_jour: strategy.mise_a_jour || '',
        notes_internes: strategy.notes_internes || '',
      });
      
      if (strategy.id) {
        loadCalendar(strategy.id);
      }
    }
  }, [strategy]);

  async function loadCalendar(strategyId: number) {
    try {
      setIsLoadingCalendar(true);
      const cal = await getEditorialCalendar(strategyId);
      setCalendar(cal);
    } catch (error) {
      console.error('Erreur chargement calendrier:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  }

  const togglePlatform = (platform: string) => {
    const platforms = formData.plateformes || [];
    if (platforms.includes(platform)) {
      setFormData({ ...formData, plateformes: platforms.filter(p => p !== platform) });
    } else {
      setFormData({ ...formData, plateformes: [...platforms, platform] });
    }
  };

  const toggleFormat = (format: string) => {
    const formats = formData.formats_envisages || [];
    if (formats.includes(format)) {
      setFormData({ ...formData, formats_envisages: formats.filter(f => f !== format) });
    } else {
      setFormData({ ...formData, formats_envisages: [...formats, format] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la stratégie');
    } finally {
      setIsSaving(false);
    }
  };

  const nextSection = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCompletedSections(prev => new Set(prev).add(currentSection));
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToSection = (index: number) => {
    setCurrentSection(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progressPercentage = ((currentSection + 1) / SECTIONS.length) * 100;
  const currentSectionData = SECTIONS[currentSection];
  const SectionIcon = currentSectionData.icon;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      {/* Header avec progression */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-md mb-8">
        <div className="px-6 py-4">
          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Étape {currentSection + 1} sur {SECTIONS.length}
              </span>
              <span className="text-sm font-semibold text-brand-orange">
                {Math.round(progressPercentage)}% complété
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Navigation par étapes */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const isCompleted = completedSections.has(index);
              const isCurrent = currentSection === index;
              
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => goToSection(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isCurrent
                      ? 'bg-brand-orange text-white shadow-md scale-105'
                      : isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu de la section actuelle */}
      <div className="px-6">
        {/* Titre de section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-4 bg-brand-orange/10 rounded-2xl">
              <SectionIcon className="w-8 h-8 text-brand-orange" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{currentSectionData.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Étape {currentSection + 1} de {SECTIONS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Sections dynamiques */}
        <div className="space-y-6">
          {currentSection === 0 && (
            <ContextSection formData={formData} setFormData={setFormData} />
          )}
          
          {currentSection === 1 && (
            <AudienceSection 
              formData={formData} 
              setFormData={setFormData}
              strategyId={strategy?.id}
              togglePlatform={togglePlatform}
            />
          )}
          
          {currentSection === 2 && (
            <PositionnementSection formData={formData} setFormData={setFormData} />
          )}
          
          {currentSection === 3 && (
            <PiliersSection strategyId={strategy?.id} />
          )}
          
          {currentSection === 4 && (
            <FormatsSection formData={formData} setFormData={setFormData} toggleFormat={toggleFormat} />
          )}
          
          {currentSection === 5 && (
            <AuditSection formData={formData} setFormData={setFormData} />
          )}
          
          {currentSection === 6 && (
            <KPIsSection strategyId={strategy?.id} />
          )}
          
          {currentSection === 7 && (
            <PESOSection formData={formData} setFormData={setFormData} />
          )}
          
          {currentSection === 8 && (
            <BudgetSection formData={formData} setFormData={setFormData} />
          )}
          
          {currentSection === 9 && (
            <PlanningSection 
              formData={formData} 
              setFormData={setFormData}
              strategy={strategy}
              calendar={calendar}
              isLoadingCalendar={isLoadingCalendar}
            />
          )}
        </div>

        {/* Navigation bas de page */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 mt-8 -mx-6 shadow-lg">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              {currentSection > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={previousSection}
                  disabled={isSaving}
                >
                  ← Précédent
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="ghost"
                className="border-2 border-green-500 text-green-700 hover:bg-green-50"
                isLoading={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {strategy ? 'Mettre à jour' : 'Sauvegarder'}
              </Button>
              
              {currentSection < SECTIONS.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextSection}
                  disabled={isSaving}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finaliser
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// Composants de sections
function ContextSection({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Contexte Général
          <span className="text-gray-500 font-normal text-xs ml-2">
            (Situation actuelle de l'entreprise/projet)
          </span>
        </label>
        <textarea
          value={formData.contexte_general || ''}
          onChange={(e) => setFormData({ ...formData, contexte_general: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Décrivez le contexte, la situation actuelle, les défis..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Objectifs Business
          <span className="text-gray-500 font-normal text-xs ml-2">
            (Notoriété, génération de leads, ventes, etc.)
          </span>
        </label>
        <textarea
          value={formData.objectifs_business || ''}
          onChange={(e) => setFormData({ ...formData, objectifs_business: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Quels sont les objectifs business de cette stratégie?"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Objectifs Réseaux Sociaux
          <span className="text-gray-500 font-normal text-xs ml-2">
            (Croissance d'audience, engagement, trafic site, etc.)
          </span>
        </label>
        <textarea
          value={formData.objectifs_reseaux || ''}
          onChange={(e) => setFormData({ ...formData, objectifs_reseaux: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Objectifs spécifiques aux réseaux sociaux..."
        />
      </div>
    </div>
  );
}

function AudienceSection({ formData, setFormData, strategyId, togglePlatform }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Cibles
        </label>
        <textarea
          value={formData.cibles || ''}
          onChange={(e) => setFormData({ ...formData, cibles: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Définissez vos cibles..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-4">
          Plateformes Sociales
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                (formData.plateformes || []).includes(platform)
                  ? 'border-brand-orange bg-brand-orange/10 text-brand-orange shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {strategyId && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl shadow-md border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Personas Marketing</h3>
          <PersonaManager strategyId={strategyId} />
        </div>
      )}
    </div>
  );
}

function PositionnementSection({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Ton & Voix de la Marque
        </label>
        <textarea
          value={formData.ton_voix || ''}
          onChange={(e) => setFormData({ ...formData, ton_voix: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Professionnel, amical, humoristique, inspirant..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Guidelines Visuelles
        </label>
        <textarea
          value={formData.guidelines_visuelles || ''}
          onChange={(e) => setFormData({ ...formData, guidelines_visuelles: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Couleurs, typographie, style visuel..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Valeurs & Messages Clés
        </label>
        <textarea
          value={formData.valeurs_messages || ''}
          onChange={(e) => setFormData({ ...formData, valeurs_messages: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Ce que la marque défend, ses messages principaux..."
        />
      </div>
    </div>
  );
}

function PiliersSection({ strategyId }: any) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl shadow-md border-2 border-green-200">
      {strategyId ? (
        <PilierManager strategyId={strategyId} />
      ) : (
        <div className="text-center py-8">
          <p className="text-green-800 font-medium">
            Les piliers de contenu seront disponibles après la création de la stratégie
          </p>
        </div>
      )}
    </div>
  );
}

function FormatsSection({ formData, setFormData, toggleFormat }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-4">
          Formats de Contenu
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONTENT_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => toggleFormat(format)}
              className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                (formData.formats_envisages || []).includes(format)
                  ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Fréquence & Calendrier
        </label>
        <textarea
          value={formData.frequence_calendrier || ''}
          onChange={(e) => setFormData({ ...formData, frequence_calendrier: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Fréquence de publication par plateforme..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Workflow & Rôles
        </label>
        <textarea
          value={formData.workflow_roles || ''}
          onChange={(e) => setFormData({ ...formData, workflow_roles: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Qui fait quoi? Processus de validation..."
        />
      </div>
    </div>
  );
}

function AuditSection({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Audit des Profils Existants
        </label>
        <textarea
          value={formData.audit_profils || ''}
          onChange={(e) => setFormData({ ...formData, audit_profils: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="État actuel des réseaux sociaux..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Benchmark Concurrents
        </label>
        <textarea
          value={formData.benchmark_concurrents || ''}
          onChange={(e) => setFormData({ ...formData, benchmark_concurrents: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Analyse de la concurrence..."
        />
      </div>
    </div>
  );
}

function KPIsSection({ strategyId }: any) {
  return (
    <div className="space-y-6">
      {strategyId ? (
        <>
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-2xl shadow-md border-2 border-red-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gestion des KPIs</h3>
            <KPIManager strategyId={strategyId} />
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dashboard KPIs</h3>
            <KPIDashboard strategyId={strategyId} />
          </div>
        </>
      ) : (
        <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 text-center">
          <p className="text-blue-800 font-medium">
            Les KPIs seront disponibles après la création de la stratégie
          </p>
        </div>
      )}
    </div>
  );
}

function PESOSection({ formData, setFormData }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Paid Media
        </label>
        <textarea
          value={formData.paid_media || ''}
          onChange={(e) => setFormData({ ...formData, paid_media: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Publicités, sponsorisations..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Earned Media
        </label>
        <textarea
          value={formData.earned_media || ''}
          onChange={(e) => setFormData({ ...formData, earned_media: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Relations presse, mentions..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Shared Media
        </label>
        <textarea
          value={formData.shared_media || ''}
          onChange={(e) => setFormData({ ...formData, shared_media: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Réseaux sociaux, partages..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Owned Media
        </label>
        <textarea
          value={formData.owned_media || ''}
          onChange={(e) => setFormData({ ...formData, owned_media: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Site web, blog, newsletter..."
        />
      </div>
    </div>
  );
}

function BudgetSection({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Budget Publicité
        </label>
        <input
          type="text"
          value={formData.budget_pub || ''}
          onChange={(e) => setFormData({ ...formData, budget_pub: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Montant mensuel..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Temps Humain & Ressources
        </label>
        <textarea
          value={formData.temps_humain || ''}
          onChange={(e) => setFormData({ ...formData, temps_humain: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Équipe, heures dédiées..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Outils & Technologies
        </label>
        <textarea
          value={formData.outils || ''}
          onChange={(e) => setFormData({ ...formData, outils: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Canva, Hootsuite, etc..."
        />
      </div>
    </div>
  );
}

function PlanningSection({ formData, setFormData, strategy, calendar, isLoadingCalendar }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Planning Global
        </label>
        <textarea
          value={formData.planning_global || ''}
          onChange={(e) => setFormData({ ...formData, planning_global: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Vue d'ensemble du planning..."
        />
      </div>

      {strategy?.id && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl shadow-md border-2 border-orange-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Calendrier Éditorial</h3>
          {isLoadingCalendar ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
          ) : calendar ? (
            <EditorialCalendarNew
              calendarId={calendar.id}
              platforms={formData.plateformes || []}
            />
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-medium">
                Le calendrier sera créé automatiquement lors de la sauvegarde
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100">
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Processus d'Itération
        </label>
        <textarea
          value={formData.processus_iteration || ''}
          onChange={(e) => setFormData({ ...formData, processus_iteration: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-gray-900"
          placeholder="Comment tester, mesurer et ajuster..."
        />
      </div>
    </div>
  );
}
