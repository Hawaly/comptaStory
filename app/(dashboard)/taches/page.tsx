"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { 
  ClipboardList, 
  Loader2,
  Calendar,
  Briefcase,
  User,
  Filter,
  CheckCircle2,
  Circle,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { 
  MandatTask,
  Mandat,
  Client,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_LABELS,
  TaskStatus,
  TaskType
} from "@/types/database";

interface TaskWithDetails extends MandatTask {
  mandat: Mandat;
  client: Client;
}

export default function TachesPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setIsLoading(true);
      setError(null);

      // Charger toutes les tâches
      const { data: tasksData, error: tasksError } = await supabase
        .from("mandat_task")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        return;
      }

      // Récupérer les IDs uniques de mandats
      const mandatIds = Array.from(new Set(tasksData.map(t => t.mandat_id)));

      // Charger tous les mandats
      const { data: mandatsData, error: mandatsError } = await supabase
        .from("mandat")
        .select("*")
        .in("id", mandatIds);

      if (mandatsError) throw mandatsError;

      // Récupérer les IDs uniques de clients
      const clientIds = Array.from(new Set((mandatsData || []).map(m => m.client_id)));

      // Charger tous les clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("client")
        .select("*")
        .in("id", clientIds);

      if (clientsError) throw clientsError;

      // Créer des maps pour un accès rapide
      const mandatsMap = new Map((mandatsData || []).map(m => [m.id, m]));
      const clientsMap = new Map((clientsData || []).map(c => [c.id, c]));

      // Combiner les données
      const tasksWithDetails: TaskWithDetails[] = tasksData
        .map(task => {
          const mandat = mandatsMap.get(task.mandat_id);
          if (!mandat) return null;
          
          const client = clientsMap.get(mandat.client_id);
          if (!client) return null;

          return {
            ...task,
            mandat,
            client
          };
        })
        .filter((task): task is TaskWithDetails => task !== null);

      setTasks(tasksWithDetails);

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Erreur lors du chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  }

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterType !== 'all' && task.type !== filterType) return false;
    return true;
  });

  // Grouper par statut pour les statistiques
  const stats = {
    total: tasks.length,
    a_faire: tasks.filter(t => t.status === 'a_faire').length,
    en_cours: tasks.filter(t => t.status === 'en_cours').length,
    terminee: tasks.filter(t => t.status === 'terminee').length,
  };

  if (isLoading) {
    return (
      <>
        <Header title="Toutes les tâches" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">Chargement des tâches...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Toutes les tâches" />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <p className="text-red-900 font-semibold">{error}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Toutes les tâches" />
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À faire</p>
                <p className="text-2xl font-bold text-gray-900">{stats.a_faire}</p>
              </div>
              <Circle className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.en_cours}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.terminee}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
              >
                <option value="all">Tous les statuts</option>
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
              >
                <option value="all">Tous les types</option>
                <option value="contenu">Contenu</option>
                <option value="video">Vidéo</option>
                <option value="reunion">Réunion</option>
                <option value="reporting">Reporting</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des tâches */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tâches ({filteredTasks.length})
          </h2>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {tasks.length === 0 
                  ? "Aucune tâche créée" 
                  : "Aucune tâche ne correspond aux filtres sélectionnés"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => router.push(`/mandats/${task.mandat_id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {task.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        <Link
                          href={`/clients/${task.client.id}`}
                          className="flex items-center hover:text-blue-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <User className="w-4 h-4 mr-1" />
                          {task.client.name}
                        </Link>
                        
                        <Link
                          href={`/mandats/${task.mandat_id}`}
                          className="flex items-center hover:text-blue-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Briefcase className="w-4 h-4 mr-1" />
                          {task.mandat.title}
                        </Link>

                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(task.due_date).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>

                      {task.details && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {task.details}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <span className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${TASK_STATUS_COLORS[task.status]}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                      
                      <span className="px-3 py-1 text-xs rounded-full whitespace-nowrap bg-gray-100 text-gray-900 font-semibold border-2 border-gray-300">
                        {TASK_TYPE_LABELS[task.type]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
