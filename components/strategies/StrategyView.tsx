"use client";

import { SocialMediaStrategy, Persona, PilierContenu, KPI } from "@/types/database";
import { Calendar, Download, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface StrategyViewProps {
  strategy: SocialMediaStrategy;
  mandatTitle?: string;
  clientName?: string;
  onEdit?: () => void;
}

export function StrategyView({ strategy, mandatTitle, clientName, onEdit }: StrategyViewProps) {
  const router = useRouter();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-4 border-blue-600">
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">{label}</h3>
        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{value}</p>
      </div>
    );
  };

  return (
    <div className="bg-white">
      {/* En-tête avec boutons d'action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-t-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stratégie Social Media</h1>
            {mandatTitle && <p className="text-xl opacity-90">{mandatTitle}</p>}
            {clientName && <p className="text-lg opacity-80">{clientName}</p>}
          </div>
          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter PDF
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-sm opacity-90">
          <Calendar className="w-4 h-4 mr-2" />
          Version {strategy.version} - Dernière mise à jour: {new Date(strategy.updated_at).toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Contenu de la stratégie */}
      <div className="p-8 print:p-4">
        {/* 1. Contexte & Objectifs */}
        <Section title="1. Contexte & Objectifs Business">
          <Field label="Contexte général" value={strategy.contexte_general} />
          <Field label="Objectifs business" value={strategy.objectifs_business} />
          <Field label="Objectifs réseaux sociaux (SMART)" value={strategy.objectifs_reseaux} />
        </Section>

        {/* 2. Audience & Personas */}
        <Section title="2. Audience & Personas">
          <Field label="Cibles principales" value={strategy.cibles} />
          
          {strategy.personas && strategy.personas.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Personas Marketing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategy.personas.map((persona: Persona, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">{persona.nom}</h4>
                    {persona.age && <p className="text-sm text-gray-700 mb-3 italic">{persona.age}</p>}
                    
                    <div className="space-y-2 text-sm">
                      {persona.besoins && (
                        <div>
                          <span className="font-bold text-gray-700">Besoins:</span>
                          <p className="text-gray-900">{persona.besoins}</p>
                        </div>
                      )}
                      {persona.problemes && (
                        <div>
                          <span className="font-bold text-gray-700">Problèmes:</span>
                          <p className="text-gray-900">{persona.problemes}</p>
                        </div>
                      )}
                      {persona.attentes && (
                        <div>
                          <span className="font-bold text-gray-700">Attentes:</span>
                          <p className="text-gray-900">{persona.attentes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.plateformes && strategy.plateformes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Plateformes sociales</h3>
              <div className="flex flex-wrap gap-2">
                {strategy.plateformes.map((platform: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-900 rounded-full font-semibold text-sm"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* 3. Positionnement & Identité */}
        <Section title="3. Positionnement & Identité de Communication">
          <Field label="Ton / Voix de la marque" value={strategy.ton_voix} />
          <Field label="Guidelines visuelles" value={strategy.guidelines_visuelles} />
          <Field label="Valeurs & messages clés" value={strategy.valeurs_messages} />
        </Section>

        {/* 4. Piliers de contenu */}
        {strategy.piliers_contenu && strategy.piliers_contenu.length > 0 && (
          <Section title="4. Piliers de Contenu">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy.piliers_contenu.map((pilier: PilierContenu, index: number) => (
                <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border-2 border-purple-200">
                  <h4 className="text-lg font-bold text-purple-900 mb-2">{pilier.titre}</h4>
                  <p className="text-gray-900 mb-2">{pilier.description}</p>
                  {pilier.exemples && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <span className="text-xs font-bold text-gray-700 uppercase">Exemples:</span>
                      <p className="text-sm text-gray-900 mt-1">{pilier.exemples}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 5. Formats & Rythme */}
        <Section title="5. Formats & Rythme de Publication">
          {strategy.formats_envisages && strategy.formats_envisages.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Formats envisagés</h3>
              <div className="flex flex-wrap gap-2">
                {strategy.formats_envisages.map((format: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-green-100 text-green-900 rounded-lg font-medium text-sm"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Field label="Fréquence & calendrier éditorial" value={strategy.frequence_calendrier} />
          <Field label="Workflow & rôles" value={strategy.workflow_roles} />
        </Section>

        {/* 6. Audit & Concurrence */}
        <Section title="6. Audit & Analyse Concurrentielle">
          <Field label="Audit des profils existants" value={strategy.audit_profils} />
          <Field label="Veille / Benchmark concurrents" value={strategy.benchmark_concurrents} />
        </Section>

        {/* 7. KPIs & Suivi */}
        <Section title="7. KPIs & Suivi">
          {strategy.kpis && strategy.kpis.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Indicateurs de performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-bold text-gray-900">KPI</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Objectif</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-bold text-gray-900">Périodicité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.kpis.map((kpi: KPI, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border-2 border-gray-300 px-4 py-3 font-semibold text-gray-900">{kpi.nom}</td>
                        <td className="border-2 border-gray-300 px-4 py-3 text-gray-900">{kpi.objectif}</td>
                        <td className="border-2 border-gray-300 px-4 py-3 text-gray-900">{kpi.periodicite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Field label="Cadre de suivi" value={strategy.cadre_suivi} />
        </Section>

        {/* 8. Canaux & Mix Média (PESO) */}
        <Section title="8. Canaux & Mix Média (Modèle PESO)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategy.owned_media && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">📱 Owned Media</h4>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{strategy.owned_media}</p>
              </div>
            )}
            {strategy.shared_media && (
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h4 className="font-bold text-green-900 mb-2">👥 Shared Media</h4>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{strategy.shared_media}</p>
              </div>
            )}
            {strategy.paid_media && (
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                <h4 className="font-bold text-orange-900 mb-2">💰 Paid Media</h4>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{strategy.paid_media}</p>
              </div>
            )}
            {strategy.earned_media && (
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-2">🏆 Earned Media</h4>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{strategy.earned_media}</p>
              </div>
            )}
          </div>
        </Section>

        {/* 9. Budget & Ressources */}
        <Section title="9. Budget & Ressources">
          <Field label="Temps humain" value={strategy.temps_humain} />
          <Field label="Outils" value={strategy.outils} />
          <Field label="Budget pub éventuel" value={strategy.budget_pub} />
        </Section>

        {/* 10. Planning & Optimisation */}
        <Section title="10. Planning, Itération & Optimisation">
          <Field label="Planning global" value={strategy.planning_global} />
          <Field label="Processus d'itération" value={strategy.processus_iteration} />
          <Field label="Mise à jour & réévaluation" value={strategy.mise_a_jour} />
        </Section>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-6 rounded-b-lg text-center text-sm text-gray-600">
        <p>Document confidentiel - © YourStory Agency {new Date().getFullYear()}</p>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print\\:p-4 {
            padding: 1rem;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
