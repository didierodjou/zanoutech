'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Subject {
  id: string;
  name: string;
  color?: string;
}

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Course {
  id: string;
  class: { id: string; name: string; level: string };
  subject: Subject;
  coefficient: number;
  scheduleSlots?: ScheduleSlot[];
}

interface MainClass {
  id: string;
  name: string;
  level: string;
  _count?: { students: number };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  phone?: string;
  specialty?: string;
  mainClass?: MainClass | null;
  subjects: Subject[];
  courses: Course[];
  user?: { email: string; createdAt: string; isActive: boolean };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mainClass, setMainClass] = useState<MainClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'class'>('overview');

  useEffect(() => {
    let isMounted = true;

    const initDashboard = async () => {
      try {
        const meRes = await fetch(`${API_URL}/auth/me`, { method: 'POST', credentials: 'include' });
        if (!meRes.ok) {
          router.push('/login');
          return;
        }

        const { user } = await meRes.json();
        if (!user?.email) {
          router.push('/login');
          return;
        }

        const profileRes = await fetch(`${API_URL}/teachers/profile-by-email?email=${encodeURIComponent(user.email)}`, { credentials: 'include' });
        if (!profileRes.ok) throw new Error("Profil enseignant indisponible.");
        
        const teacherProfile = await profileRes.json();
        if (!teacherProfile?.id) throw new Error("Identifiant enseignant introuvable.");

        const [tRes, cRes, mRes] = await Promise.all([
          fetch(`${API_URL}/teachers/${teacherProfile.id}`, { credentials: 'include' }),
          fetch(`${API_URL}/teachers/${teacherProfile.id}/courses`, { credentials: 'include' }),
          fetch(`${API_URL}/teachers/${teacherProfile.id}/main-class`, { credentials: 'include' }),
        ]);

        if (!tRes.ok) throw new Error("Erreur d'extraction des métriques.");

        const [tData, cData, mData] = await Promise.all([tRes.json(), cRes.json(), mRes.json()]);

        if (isMounted) {
          setTeacher(tData);
          setCourses(Array.isArray(cData) ? cData : []);
          setMainClass(mData);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Erreur de connexion au serveur.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initDashboard();
    return () => { isMounted = false; };
  }, [router]);

  // Agrégation des statistiques
  const stats = useMemo(() => {
    const uniqueClasses = new Set(courses.map((c) => c.class?.id)).size;
    return {
      totalCourses: courses.length,
      uniqueClasses,
      totalSubjects: teacher?.subjects?.length ?? 0,
      studentCount: mainClass?._count?.students ?? 0,
    };
  }, [courses, teacher, mainClass]);

  // Salutation dynamique
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
        <Icon icon="fa-exclamation-triangle" className="text-3xl text-rose-500 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Erreur de chargement</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition">
          Actualiser la page
        </button>
      </div>
    );
  }

  if (!teacher) return null;

  const displayName = `${teacher.firstName} ${teacher.lastName}`;
  const initials = `${teacher.firstName[0] || ''}${teacher.lastName[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* ── Banner Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {teacher.photo ? (
            <img src={teacher.photo} alt={displayName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200" />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{greeting},</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {mainClass && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-md">
                  <Icon icon="fa-star" className="text-amber-500" /> Prof. principal — {mainClass.name}
                </span>
              )}
              {teacher.specialty && (
                <span className="text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-md">
                  {teacher.specialty}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Link href="/teacher/grades" className="flex-1 lg:flex-none text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm">
            <Icon icon="fa-pen-to-square" /> Saisir des notes
          </Link>
          <Link href="/teacher/schedule" className="flex-1 lg:flex-none text-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2">
            <Icon icon="fa-calendar" /> Emploi du temps
          </Link>
        </div>
      </div>

      {/* ── Metric Cards Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="fa-book-open" label="Cours attribués" value={stats.totalCourses} sub="Année académique" />
        <MetricCard icon="fa-chalkboard" label="Classes d'enseignement" value={stats.uniqueClasses} sub="Niveaux confondus" />
        <MetricCard icon="fa-atom" label="Matières activées" value={stats.totalSubjects} sub="Spécialités" />
        <MetricCard icon="fa-users" label="Élèves suivis" value={mainClass ? stats.studentCount : '—'} sub={mainClass ? `Classe : ${mainClass.name}` : 'Aucune classe globale'} />
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 flex gap-6">
        {[
          { key: 'overview', label: 'Vue d\'ensemble', icon: 'fa-table-cells-large' },
          { key: 'courses', label: `Mes Cours (${stats.totalCourses})`, icon: 'fa-book' },
          ...(mainClass ? [{ key: 'class', label: 'Ma Classe principale', icon: 'fa-user-group' }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon={tab.icon as any} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Views ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Matières assignées</h3>
            {!teacher.subjects.length ? (
              <p className="text-xs text-slate-400">Aucune matière.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || '#6366f1' }} />
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Classes actives</h3>
            {!courses.length ? (
              <p className="text-xs text-slate-400">Aucune classe répertoriée.</p>
            ) : (
              <div className="space-y-2">
                {Array.from(new Map(courses.map((c) => [c.class?.id, c.class])).values()).map((cls) => (
                  <div key={cls?.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700">
                    <span>{cls?.name}</span>
                    <span className="text-slate-400">{cls?.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Coordonnées professionnelles</h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-800">{teacher.user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Téléphone:</span>
                <span className="font-medium text-slate-800">{teacher.phone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Statut compte:</span>
                <span className={`font-semibold ${teacher.user?.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {teacher.user?.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            <Link href="/teacher/profile" className="mt-4 block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">
              Editer le profil
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const slot = course.scheduleSlots?.[0];
            return (
              <div key={course.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-slate-300 transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md text-white" style={{ backgroundColor: course.subject?.color || '#6366f1' }}>
                    {course.subject?.name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Coef. {course.coefficient}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Classe : {course.class?.name}</h4>
                  <p className="text-xs text-slate-500">{course.class?.level}</p>
                </div>
                {slot && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <Icon icon="fa-clock" className="text-slate-400" />
                    <span>{DAYS[slot.dayOfWeek - 1]} · {slot.startTime} - {slot.endTime}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'class' && mainClass && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{mainClass.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Niveau : {mainClass.level} • {mainClass._count?.students ?? 0} élèves inscrits</p>
          </div>
          <Link href="/teacher/students" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-sm">
            Consulter le registre d'appel
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Composants auxilaires ───────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-sm">
          <Icon icon={icon as any} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 animate-pulse">
      <div className="h-44 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  );
}