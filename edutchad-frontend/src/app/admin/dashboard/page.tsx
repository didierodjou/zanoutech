'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

// Types basés sur les réponses du backend
interface DashboardStats {
  students: number;
  teachers: number;
  classes: number;
  staff: number;
  subjects: number;
  principals: number;
  pendingSalaries: number;
  totalClasses: number;
  recentActivities: number;
  recentInscriptions: number;
}

interface Activity {
  id: string;
  date: string;
  activity: string;
  user: string;
  type: 'inscription' | 'paiement' | 'note' | 'autre';
}

interface RecentStudent {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  date: string;
}

interface DashboardData {
  stats: DashboardStats;
  activities: Activity[];
  recentStudents: RecentStudent[];
  evolution: number[];
  distribution: { level: string; count: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    stats: {
      students: 0,
      teachers: 0,
      classes: 0,
      staff: 0,
      subjects: 0,
      principals: 0,
      pendingSalaries: 0,
      totalClasses: 0,
      recentActivities: 0,
      recentInscriptions: 0
    },
    activities: [],
    recentStudents: [],
    evolution: [],
    distribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('Administrateur');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Administrateur');
      } catch (e) {
        console.error('Erreur parsing user', e);
      }
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const statsRes = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsRes.ok) {
        throw new Error(`Erreur API: ${statsRes.status}`);
      }

      const statsData = await statsRes.json();

      const [activitiesRes, studentsRes, evolutionRes, distributionRes] = await Promise.all([
        fetch(`${baseUrl}/dashboard/activities?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/dashboard/recent-students?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/dashboard/evolution`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/dashboard/distribution`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let activitiesData: Activity[] = [];
      if (activitiesRes.ok) activitiesData = await activitiesRes.json();

      let recentStudentsData: RecentStudent[] = [];
      if (studentsRes.ok) recentStudentsData = await studentsRes.json();

      let evolutionData: number[] = [];
      if (evolutionRes.ok) evolutionData = await evolutionRes.json();

      let distributionData: { level: string; count: number }[] = [];
      if (distributionRes.ok) distributionData = await distributionRes.json();

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const recentInscriptions = recentStudentsData.filter(s => {
        const [day, month, year] = s.date.split('/').map(Number);
        const studentDate = new Date(year, month - 1, day);
        return studentDate >= startOfMonth;
      }).length;

      setData({
        stats: {
          students: statsData.students || 0,
          teachers: statsData.teachers || 0,
          classes: statsData.classes || 0,
          staff: statsData.staff || 0,
          subjects: statsData.subjects || 0,
          principals: statsData.principals || 0,
          pendingSalaries: statsData.pendingSalaries || 0,
          totalClasses: statsData.classes || 0,
          recentActivities: activitiesData.length,
          recentInscriptions: recentInscriptions
        },
        activities: activitiesData,
        recentStudents: recentStudentsData,
        evolution: evolutionData,
        distribution: distributionData
      });

    } catch (error) {
      console.error("Erreur chargement dashboard", error);
      setError("Impossible de charger les données. Veuillez réessayer.");

      setData({
        stats: {
          students: 2,
          teachers: 2,
          classes: 4,
          staff: 1,
          subjects: 4,
          principals: 1,
          pendingSalaries: 0,
          totalClasses: 4,
          recentActivities: 0,
          recentInscriptions: 0
        },
        activities: [],
        recentStudents: [],
        evolution: [120, 135, 150, 168, 185, 200, 220, 245, 260, 275, 285, 290],
        distribution: [
          { level: '6ème A', count: 25 },
          { level: '6ème B', count: 24 },
          { level: '5ème A', count: 22 },
          { level: '5ème B', count: 23 },
          { level: '4ème A', count: 20 },
          { level: '4ème B', count: 21 },
          { level: '3ème A', count: 18 },
          { level: '3ème B', count: 19 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const averageAttendance = 94;

  return (
    <div>
      {/* Header de la page — version desktop riche, mobile compact */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Tableau de Bord</h1>
          <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
            <Icon icon="fa-calendar-alt" className="text-slate-400" />
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm disabled:opacity-50 text-sm"
          >
            <Icon icon="fa-sync-alt" className={loading ? 'fa-spin' : ''} />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>

          {/* Info utilisateur visible uniquement sur desktop */}
          <div className="hidden sm:flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{userName}</p>
              <p className="text-xs text-slate-500">Proviseur / DG</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3 text-sm">
          <Icon icon="fa-exclamation-triangle" className="text-red-700 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={handleRefresh} className="text-sm underline whitespace-nowrap">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 md:h-96">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
            <p className="text-slate-600 text-sm">Chargement des données...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 md:space-y-8">

          {/* ==========================================
              1. STATS PRINCIPALES
             ========================================== */}
          {/* Mobile : grille 2 colonnes. Desktop : 4 colonnes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              title="Élèves"
              value={data.stats.students}
              icon="fa-user-graduate"
              color="blue"
              link="/admin/students"
            />
            <StatCard
              title="Professeurs"
              value={data.stats.teachers}
              icon="fa-user-tie"
              color="green"
              subValue={data.stats.principals ? `${data.stats.principals} principaux` : undefined}
              link="/admin/teachers"
            />
            <StatCard
              title="Classes"
              value={data.stats.classes}
              icon="fa-chalkboard-teacher"
              color="purple"
              subValue={data.stats.students && data.stats.classes
                ? `${Math.round(data.stats.students / data.stats.classes)} él./classe`
                : undefined}
              link="/admin/classes"
            />
            <StatCard
              title="Personnel"
              value={data.stats.staff}
              icon="fa-users"
              color="red"
              subValue="Administratif"
              link="/admin/staff"
            />
          </div>

          {/* ==========================================
              2. STATS SECONDAIRES
             ========================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              title="Matières"
              value={data.stats.subjects}
              icon="fa-book"
              color="yellow"
              link="/admin/subjects"
            />
            <StatCard
              title="Salaires att."
              value={data.stats.pendingSalaries}
              icon="fa-money-bill-wave"
              color="indigo"
              link="/admin/salaries"
            />
            <StatCard
              title="Inscriptions"
              value={data.stats.recentInscriptions}
              icon="fa-user-plus"
              color="teal"
              subValue="Ce mois"
              link="/admin/students"
            />
            <StatCard
              title="Présence"
              value={averageAttendance}
              icon="fa-chart-line"
              color="orange"
              isPercentage={true}
              link="/admin/attendance"
            />
          </div>

          {/* ==========================================
              3. ACTIONS RAPIDES (mobile en premier)
             ========================================== */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h3 className="font-semibold text-slate-700 mb-3 md:mb-4 text-sm md:text-base">
              <Icon icon="fa-bolt" className="text-yellow-500 mr-2" />
              Actions Rapides
            </h3>
            {/* Mobile : 3 par ligne. Desktop : 5 par ligne */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              <QuickAction
                icon="fa-user-plus"
                label="Nouvel Élève"
                onClick={() => router.push('/admin/students')}
                color="blue"
              />
              <QuickAction
                icon="fa-user-tie"
                label="Nouveau Prof"
                onClick={() => router.push('/admin/teachers')}
                color="green"
              />
              <QuickAction
                icon="fa-money-bill-wave"
                label="Paiements"
                onClick={() => router.push('/admin/salaries')}
                color="indigo"
              />
              <QuickAction
                icon="fa-calendar-alt"
                label="Emploi du temps"
                onClick={() => router.push('/admin/schedule')}
                color="orange"
              />
              <QuickAction
                icon="fa-file-alt"
                label="Bulletins"
                onClick={() => router.push('/admin/students')}
                color="red"
              />
            </div>
          </div>

          {/* ==========================================
              4. ACTIVITÉS + INSCRIPTIONS RÉCENTES
             ========================================== */}
          {/* Mobile : colonne unique. Desktop : 2/3 + 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Activités récentes */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm md:text-base">
                  <Icon icon="fa-history" className="text-blue-500 mr-2" />
                  Activités Récentes
                </h3>
              </div>

              {data.activities.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.activities.map((activity) => (
                    <div key={activity.id} className="px-4 md:px-6 py-3 md:py-4 hover:bg-slate-50 transition flex items-start gap-3">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.type === 'inscription' ? 'bg-green-500' :
                        activity.type === 'paiement' ? 'bg-blue-500' :
                        activity.type === 'note' ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 leading-snug">{activity.activity}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Icon icon="fa-users" />
                            {activity.user}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Icon icon="fa-calendar" />
                            {activity.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Icon icon="fa-clock" className="text-2xl mb-2" />
                  <p className="text-sm">Aucune activité récente</p>
                </div>
              )}
            </div>

            {/* Inscriptions récentes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm md:text-base">
                  <Icon icon="fa-user-plus" className="text-green-500 mr-2" />
                  Dernières Inscriptions
                </h3>
              </div>

              <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                {data.recentStudents.length > 0 ? (
                  data.recentStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                          <Icon icon="fa-school" />
                          {student.className} • {student.date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-4">
                    <Icon icon="fa-user-slash" className="text-2xl mb-2" />
                    <p className="text-sm">Aucune inscription récente</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==========================================
              5. GRAPHIQUES
             ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Évolution des effectifs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
              <h3 className="font-semibold text-slate-700 mb-3 md:mb-4 text-sm md:text-base">
                <Icon icon="fa-chart-line" className="text-blue-500 mr-2" />
                Évolution des Effectifs
              </h3>
              <div className="h-48 md:h-64">
                {data.evolution.length > 0 ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 flex items-end justify-between gap-1 md:gap-2">
                      {data.evolution.slice(-12).map((value, index) => {
                        const max = Math.max(...data.evolution);
                        const height = (value / max) * 100;
                        const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                        const monthIndex = (new Date().getMonth() - 11 + index + 12) % 12;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full flex justify-center">
                              <div
                                className="w-full max-w-[28px] bg-blue-500 rounded-t-md hover:bg-blue-600 transition cursor-pointer"
                                style={{ height: `${height}%`, minHeight: '4px' }}
                              >
                                <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                                  {value}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{months[monthIndex]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-slate-500 text-center">
                      12 derniers mois
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Icon icon="fa-chart-bar" className="text-3xl" />
                    <span className="text-sm">Données non disponibles</span>
                  </div>
                )}
              </div>
            </div>

            {/* Répartition par niveau */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
              <h3 className="font-semibold text-slate-700 mb-3 md:mb-4 text-sm md:text-base">
                <Icon icon="fa-chart-pie" className="text-purple-500 mr-2" />
                Répartition par Niveau
              </h3>
              <div className="h-48 md:h-64 overflow-y-auto pr-1">
                {data.distribution.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {data.distribution.map((item, index) => {
                      const total = data.distribution.reduce((acc, curr) => acc + curr.count, 0);
                      const percentage = (item.count / total) * 100;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500'];
                      const colorIndex = index % colors.length;

                      return (
                        <div key={`${item.level}-${index}`} className="space-y-1">
                          <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-slate-600 font-medium">{item.level}</span>
                            <span className="text-slate-800 font-semibold whitespace-nowrap ml-2">
                              {item.count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 md:h-3 overflow-hidden">
                            <div
                              className={`${colors[colorIndex]} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Icon icon="fa-chart-pie" className="text-3xl" />
                    <span className="text-sm">Données non disponibles</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ============================================
// Composant Carte Statistique
// ============================================
function StatCard({ title, value, icon, color, subValue, link, isPercentage = false }: any) {
  const router = useRouter();

  const colorClasses: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  const iconColors: any = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500'
  };

  return (
    <div
      onClick={() => link && router.push(link)}
      className={`${colorClasses[color]} p-3 md:p-6 rounded-xl border transition-all hover:shadow-lg cursor-pointer active:scale-95 md:hover:-translate-y-1`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm font-medium opacity-80 truncate">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold mt-0.5 md:mt-1">
            {value}{isPercentage ? '%' : ''}
          </h3>
          {subValue && (
            <p className="text-xs mt-0.5 opacity-60 truncate hidden sm:block">
              {subValue}
            </p>
          )}
        </div>
        <div className={`w-9 h-9 md:w-12 md:h-12 ${iconColors[color]} rounded-xl flex items-center justify-center text-base md:text-xl text-white shadow-lg flex-shrink-0 ml-2`}>
          <Icon icon={icon} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Composant Action Rapide
// ============================================
function QuickAction({ icon, label, onClick, color }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-600',
    indigo: 'bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600',
    orange: 'bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-600',
    red: 'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} p-3 md:p-4 rounded-lg text-center transition flex flex-col items-center gap-1.5 md:gap-2 active:scale-95 md:hover:scale-105`}
    >
      <Icon icon={icon} className="text-lg md:text-xl" />
      <span className="text-[10px] md:text-xs font-medium leading-tight">{label}</span>
    </button>
  );
}