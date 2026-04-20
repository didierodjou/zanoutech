'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Course {
  id: string;
  class: { id: string; name: string; level: string };
  subject: { id: string; name: string; color: string };
  coefficient: number;
  scheduleSlots?: { dayOfWeek: number; startTime: string; endTime: string }[];
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
  isHeadTeacher?: boolean;
  mainClass?: MainClass | null;
  subjects: Subject[];
  courses: Course[];
  user?: { email: string; createdAt: string; isActive: boolean };
  _count?: { courses: number; subjects: number };
}

// ─── Couleur par défaut pour une matière sans color ─────────────────────────
const subjectColor = (color?: string) =>
  color || '#3b82f6';

// ─── Jours de la semaine ─────────────────────────────────────────────────────
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// ─── Salutation dynamique ────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: string; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0"
        style={{ background: accent }}
      >
        <Icon icon={icon as any} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Badge matière ───────────────────────────────────────────────────────────
function SubjectBadge({ subject }: { subject: Subject }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: subjectColor(subject.color) }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
      {subject.name}
    </span>
  );
}

// ─── Mini cours card ─────────────────────────────────────────────────────────
function CourseCard({ course }: { course: Course }) {
  const slot = course.scheduleSlots?.[0];
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center gap-4">
      <div
        className="w-2 self-stretch rounded-full flex-shrink-0"
        style={{ background: subjectColor(course.subject?.color) }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{course.subject?.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          <Icon icon="fa-chalkboard" className="mr-1" />
          Classe {course.class?.name}
        </p>
        {slot && (
          <p className="text-xs text-slate-400 mt-0.5">
            <Icon icon="fa-clock" className="mr-1" />
            {DAYS[slot.dayOfWeek - 1]} · {slot.startTime}–{slot.endTime}
          </p>
        )}
      </div>
      <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
        Coef. {course.coefficient}
      </span>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mainClass, setMainClass] = useState<MainClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'class'>('overview');

  // ── Chargement des données ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(storedUser);
    const teacherId = userData.teacherId;

    if (!teacherId) {
      setError("Identifiant enseignant introuvable. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const safeJson = async (res: Response, fallback: any) => {
      if (!res.ok) return fallback;
      const text = await res.text();
      if (!text || text === 'null') return fallback;
      try { return JSON.parse(text); } catch { return fallback; }
    };

    Promise.all([
      fetch(`http://localhost:3001/teachers/${teacherId}`, { headers }),
      fetch(`http://localhost:3001/teachers/${teacherId}/courses`, { headers }),
      fetch(`http://localhost:3001/teachers/${teacherId}/main-class`, { headers }),
    ])
      .then(async ([tRes, cRes, mRes]) => {
        if (!tRes.ok) throw new Error('Profil introuvable');
        const [teacherData, coursesData, mainClassData] = await Promise.all([
          safeJson(tRes, null),
          safeJson(cRes, []),
          safeJson(mRes, null),
        ]);
        setTeacher(teacherData);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setMainClass(mainClassData);
      })
      .catch((err) => {
        console.error('Erreur chargement dashboard:', err);
        setError('Impossible de charger vos données. Vérifiez votre connexion.');
      })
      .finally(() => setLoading(false));
  }, [router]);

  // ── Calculs stats ─────────────────────────────────────────────────────────
  const uniqueClasses = new Set(courses.map((c) => c.class?.id)).size;
  const uniqueSubjects = teacher?.subjects?.length ?? 0;
  const totalCourses = courses.length;
  const isHeadTeacher = !!mainClass;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Icon icon="fa-exclamation-triangle" className="text-red-500 text-2xl" />
        </div>
        <p className="text-slate-600 font-medium">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (!teacher) return null;

  const displayName = `${teacher.firstName} ${teacher.lastName}`;
  const initials = [teacher.firstName[0], teacher.lastName[0]].join('').toUpperCase();

  return (
    <div className="space-y-8">

      {/* ── Bandeau de bienvenue ───────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-8 overflow-hidden shadow-xl">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {teacher.photo ? (
              <img
                src={teacher.photo}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/30 shadow-xl">
                {initials}
              </div>
            )}
            <div>
              <p className="text-blue-200 text-sm font-medium">{getGreeting()},</p>
              <h1 className="text-3xl font-bold text-white">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isHeadTeacher && (
                  <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-semibold px-3 py-1 rounded-full">
                    <Icon icon="fa-star" />
                    Professeur Principal — {mainClass?.name}
                  </span>
                )}
                {teacher.specialty && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                    <Icon icon="fa-graduation-cap" />
                    {teacher.specialty}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/teacher/grades"
              className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow-lg text-sm"
            >
              <Icon icon="fa-clipboard-list" />
              Saisir des notes
            </Link>
            <Link
              href="/teacher/schedule"
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 font-medium px-5 py-2.5 rounded-xl hover:bg-white/20 transition text-sm"
            >
              <Icon icon="fa-calendar-alt" />
              Emploi du temps
            </Link>
          </div>
        </div>
      </div>

      {/* ── Statistiques ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon="fa-book-open"
          label="Cours enseignés"
          value={totalCourses}
          sub="au total cette année"
          accent="linear-gradient(135deg,#3b82f6,#2563eb)"
        />
        <StatCard
          icon="fa-chalkboard"
          label="Classes"
          value={uniqueClasses}
          sub="classes différentes"
          accent="linear-gradient(135deg,#8b5cf6,#7c3aed)"
        />
        <StatCard
          icon="fa-atom"
          label="Matières"
          value={uniqueSubjects}
          sub={teacher.subjects.map((s) => s.name).join(', ') || '—'}
          accent="linear-gradient(135deg,#10b981,#059669)"
        />
        <StatCard
          icon="fa-users"
          label={isHeadTeacher ? 'Élèves (classe principale)' : 'Classe principale'}
          value={isHeadTeacher ? (mainClass?._count?.students ?? '—') : '—'}
          sub={isHeadTeacher ? mainClass?.name : 'Pas de classe principale'}
          accent="linear-gradient(135deg,#f59e0b,#d97706)"
        />
      </div>

      {/* ── Onglets ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {(
          [
            { key: 'overview' as const, icon: 'fa-th-large', label: 'Vue générale' },
            { key: 'courses' as const, icon: 'fa-book', label: `Mes cours (${totalCourses})` },
            ...(isHeadTeacher ? [{ key: 'class' as const, icon: 'fa-users', label: 'Ma classe' }] : []),
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white border border-b-white border-slate-200 text-blue-600 -mb-px shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon icon={tab.icon as any} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenu des onglets ────────────────────────────────────────────── */}

      {/* Vue générale */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Matières enseignées */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Icon icon="fa-atom" className="text-green-500" />
              Mes matières
            </h3>
            {teacher.subjects.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune matière assignée.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((s) => (
                  <SubjectBadge key={s.id} subject={s} />
                ))}
              </div>
            )}
          </div>

          {/* Classes actives */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Icon icon="fa-chalkboard" className="text-purple-500" />
              Classes actives
            </h3>
            {courses.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun cours assigné.</p>
            ) : (
              <ul className="space-y-2">
                {Array.from(
                  new Map(courses.map((c) => [c.class?.id, c.class])).values()
                ).map((cls) => (
                  <li key={cls?.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span className="font-medium">{cls?.name}</span>
                    <span className="text-slate-400">· {cls?.level}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Infos profil */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Icon icon="fa-id-card" className="text-blue-500" />
              Informations
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-600">
                <Icon icon="fa-envelope" className="text-slate-400 w-4 text-center" />
                <span className="truncate">{teacher.user?.email || '—'}</span>
              </li>
              {teacher.phone && (
                <li className="flex items-center gap-3 text-slate-600">
                  <Icon icon="fa-phone" className="text-slate-400 w-4 text-center" />
                  {teacher.phone}
                </li>
              )}
              {teacher.specialty && (
                <li className="flex items-center gap-3 text-slate-600">
                  <Icon icon="fa-graduation-cap" className="text-slate-400 w-4 text-center" />
                  {teacher.specialty}
                </li>
              )}
              <li className="flex items-center gap-3 text-slate-600">
                <Icon icon="fa-calendar-check" className="text-slate-400 w-4 text-center" />
                Membre depuis{' '}
                {teacher.user?.createdAt
                  ? new Date(teacher.user.createdAt).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="fa-circle" className={`w-4 text-center text-xs ${teacher.user?.isActive ? 'text-green-500' : 'text-red-400'}`} />
                <span className={`font-medium ${teacher.user?.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {teacher.user?.isActive ? 'Compte actif' : 'Compte inactif'}
                </span>
              </li>
            </ul>
            <Link
              href="/teacher/profile"
              className="mt-5 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition"
            >
              <Icon icon="fa-user-edit" />
              Modifier mon profil
            </Link>
          </div>

          {/* Classe principale (si professeur principal) */}
          {isHeadTeacher && mainClass && (
            <div className="lg:col-span-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center">
                    <Icon icon="fa-star" className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Classe principale</p>
                    <p className="text-2xl font-bold text-yellow-900">{mainClass.name}</p>
                    <p className="text-sm text-yellow-700">
                      {mainClass.level} ·{' '}
                      {mainClass._count?.students ?? 0} élève(s)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/teacher/students"
                    className="flex items-center gap-2 bg-yellow-400 text-yellow-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-yellow-500 transition text-sm shadow"
                  >
                    <Icon icon="fa-user-graduate" />
                    Voir mes élèves
                  </Link>
                  <Link
                    href="/teacher/grades"
                    className="flex items-center gap-2 bg-white text-yellow-800 border border-yellow-300 font-medium px-5 py-2.5 rounded-xl hover:bg-yellow-50 transition text-sm"
                  >
                    <Icon icon="fa-clipboard-list" />
                    Saisir les notes
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mes cours */}
      {activeTab === 'courses' && (
        <div>
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
              <Icon icon="fa-book-open" className="text-5xl text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Aucun cours assigné pour le moment.</p>
              <p className="text-slate-400 text-sm mt-1">Contactez l'administration pour plus d'informations.</p>
            </div>
          ) : (
            <>
              {/* Regroupé par classe */}
              {Array.from(new Map(courses.map((c) => [c.class?.id, c.class])).entries()).map(
                ([classId, cls]) => {
                  const classCourses = courses.filter((c) => c.class?.id === classId);
                  return (
                    <div key={classId} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-3 h-3 bg-purple-500 rounded-full" />
                        <h3 className="font-bold text-slate-700">
                          {cls?.name}{' '}
                          <span className="text-slate-400 font-normal text-sm">· {cls?.level}</span>
                        </h3>
                        <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          {classCourses.length} cours
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {classCourses.map((course) => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </>
          )}
        </div>
      )}

      {/* Ma classe (professeur principal) */}
      {activeTab === 'class' && isHeadTeacher && mainClass && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{mainClass.name}</h3>
              <p className="text-slate-500 text-sm mt-1">
                <Icon icon="fa-layer-group" className="mr-1" />
                {mainClass.level} ·{' '}
                <Icon icon="fa-users" className="mx-1" />
                {mainClass._count?.students ?? 0} élève(s) inscrit(s)
              </p>
            </div>
            <Link
              href="/teacher/students"
              className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm shadow"
            >
              <Icon icon="fa-user-graduate" />
              Voir la liste des élèves
            </Link>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Icon icon="fa-info-circle" className="text-blue-500 text-xl" />
            </div>
            <div>
              <p className="text-slate-700 font-medium">Vous êtes professeur principal de la classe {mainClass.name}.</p>
              <p className="text-slate-500 text-sm mt-1">
                Accédez à la gestion des élèves, notes et absences depuis les menus dédiés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Liens rapides en bas ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {(
          [
            { href: '/teacher/grades', icon: 'fa-clipboard-list' as const, label: 'Notes', color: 'from-blue-500 to-blue-600' },
            { href: '/teacher/schedule', icon: 'fa-calendar-alt' as const, label: 'Emploi du temps', color: 'from-purple-500 to-purple-600' },
            { href: '/teacher/classes', icon: 'fa-chalkboard-teacher' as const, label: 'Mes classes', color: 'from-green-500 to-green-600' },
            { href: '/teacher/profile', icon: 'fa-user-cog' as const, label: 'Mon profil', color: 'from-slate-500 to-slate-600' },
          ] as const
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center hover:scale-105 transition-transform shadow-md`}
          >
            <Icon icon={item.icon} className="text-2xl opacity-90" />
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
