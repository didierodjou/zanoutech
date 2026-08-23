// app/admin/meetings/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '@/components/ui/Icon';

/* ============================================================
   TYPES
============================================================ */

interface Participant {
  id: string;
  user: {
    id: string;
    email: string;
    role: string;
    studentProfile?: { firstName: string; lastName: string };
    teacherProfile?: { firstName: string; lastName: string };
    staffProfile?: { firstName: string; lastName: string };
  };
}

interface Meeting {
  id: string;
  title: string;
  type: string;
  date: string;
  duration: number;
  location: string;
  agenda: string | null;
  organizer: { firstName: string; lastName: string };
  organizerId: string;
  participants: Participant[];
  createdAt?: string;
}

interface AvailableUser {
  id: string; // userId (participant)
  email: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'STAFF';
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

interface TeacherOption {
  id: string; // Teacher.id (utilisé pour organizerId)
  name: string;
}

interface FormState {
  title: string;
  type: string;
  date: string;
  duration: number;
  location: string;
  agenda: string;
  participantUserIds: string[];
  organizerId: string;
}

type ModalKind = 'create' | 'details' | 'edit' | 'delete' | null;
type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'UPCOMING' | 'PAST';
type ParticipantRoleTab = 'ALL' | 'TEACHER' | 'STUDENT' | 'STAFF';

interface Toast {
  message: string;
  kind: 'success' | 'error';
}

/* ============================================================
   CONFIGURATION MÉTIER
   Les types de réunion sont volontairement pensés pour un
   établissement scolaire : parents-professeurs, conseils
   pédagogiques, réunions administratives, disciplinaires et
   réunions internes au personnel.
============================================================ */

const TYPE_SELECT_OPTIONS = [
  { value: 'PARENTS_TEACHERS', label: 'Parents – Professeurs' },
  { value: 'PEDAGOGIQUE', label: 'Conseil pédagogique / de classe' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'DISCIPLINAIRE', label: 'Disciplinaire' },
  { value: 'STAFF', label: 'Personnel' },
];

// Alias conservés pour rester compatible avec les données existantes
// (anciens types enregistrés avant cette mise à jour).
const TYPE_CONFIG: Record<string, { label: string; icon: string; chip: string; bar: string }> = {
  PARENTS_TEACHERS: { label: 'Parents – Professeurs', icon: 'fa-people-arrows', chip: 'bg-purple-50 text-purple-700 border-purple-200', bar: 'bg-purple-500' },
  PARENTS: { label: 'Parents – Professeurs', icon: 'fa-people-arrows', chip: 'bg-purple-50 text-purple-700 border-purple-200', bar: 'bg-purple-500' },
  PEDAGOGIQUE: { label: 'Conseil pédagogique', icon: 'fa-chalkboard-user', chip: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500' },
  STUDENTS: { label: 'Conseil de classe', icon: 'fa-chalkboard-user', chip: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500' },
  ADMINISTRATIVE: { label: 'Administrative', icon: 'fa-building-columns', chip: 'bg-slate-50 text-slate-700 border-slate-200', bar: 'bg-slate-500' },
  ADMIN: { label: 'Administrative', icon: 'fa-building-columns', chip: 'bg-slate-50 text-slate-700 border-slate-200', bar: 'bg-slate-500' },
  DISCIPLINAIRE: { label: 'Disciplinaire', icon: 'fa-gavel', chip: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500' },
  STAFF: { label: 'Personnel', icon: 'fa-users-gear', chip: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
  TEACHERS: { label: 'Enseignants', icon: 'fa-chalkboard-user', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', bar: 'bg-indigo-500' },
};

const DEFAULT_TYPE_CONFIG = { label: '', icon: 'fa-calendar', chip: 'bg-gray-50 text-gray-600 border-gray-200', bar: 'bg-gray-400' };

const getTypeConfig = (type: string) => TYPE_CONFIG[type] ?? { ...DEFAULT_TYPE_CONFIG, label: type };

const DURATION_PRESETS = [15, 30, 45, 60, 90];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Enseignant',
  STUDENT: 'Élève',
  STAFF: 'Personnel',
};

const EMPTY_FORM = (organizerId = ''): FormState => ({
  title: '',
  type: 'PARENTS_TEACHERS',
  date: '',
  duration: 30,
  location: '',
  agenda: '',
  participantUserIds: [],
  organizerId,
});

/* ============================================================
   HELPERS DATE
============================================================ */

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

type Bucket = 'today' | 'tomorrow' | 'week' | 'later' | 'past';

const getBucket = (dateStr: string): Bucket => {
  const target = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  if (target.getTime() < today.getTime()) return 'past';
  if (isSameDay(target, today)) return 'today';
  if (isSameDay(target, addDays(today, 1))) return 'tomorrow';
  if (target.getTime() <= addDays(today, 7).getTime()) return 'week';
  return 'later';
};

const formatFullDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const formatDayLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('fr-FR', { day: '2-digit' }),
    month: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
  };
};

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  week: 'Cette semaine',
  later: 'À venir',
  past: 'Passées',
};

const BUCKET_ORDER: Bucket[] = ['today', 'tomorrow', 'week', 'later'];

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [showPast, setShowPast] = useState(false);

  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);
  const [loadingTeacher, setLoadingTeacher] = useState(true);

  const [form, setForm] = useState<FormState>(EMPTY_FORM());

  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [participantSearch, setParticipantSearch] = useState('');
  const [participantTab, setParticipantTab] = useState<ParticipantRoleTab>('ALL');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const apiUrl = (path: string) => {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const notify = (message: string, kind: Toast['kind'] = 'success') => setToast({ message, kind });

  /* ---------------- CHARGEMENT ---------------- */

  const fetchCurrentTeacher = useCallback(async () => {
    try {
      setLoadingTeacher(true);
      const res = await fetch(apiUrl('/teachers/profile'), { credentials: 'include' });
      if (!res.ok) {
        // L'utilisateur connecté n'a pas de profil enseignant (ex : administrateur).
        // Ce n'est pas une erreur : il pourra choisir un organisateur dans le formulaire.
        setCurrentTeacherId(null);
        return;
      }
      const data = await res.json();
      setCurrentTeacherId(data.id);
      setForm((prev) => (prev.organizerId ? prev : { ...prev, organizerId: data.id }));
    } catch (err) {
      // Erreur réseau uniquement : on n'affiche pas de bandeau bloquant, l'admin
      // peut toujours planifier une réunion en choisissant l'organisateur manuellement.
      console.error('Erreur récupération du profil enseignant:', err);
      setCurrentTeacherId(null);
    } finally {
      setLoadingTeacher(false);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/meetings'), { credentials: 'include' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMeetings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des réunions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const [teachersRes, studentsRes, staffRes] = await Promise.all([
        fetch(apiUrl('/teachers'), { credentials: 'include' }),
        fetch(apiUrl('/students'), { credentials: 'include' }),
        fetch(apiUrl('/staff'), { credentials: 'include' }),
      ]);

      const teachers = teachersRes.ok ? await teachersRes.json() : [];
      const students = studentsRes.ok ? await studentsRes.json() : [];
      const staff = staffRes.ok ? await staffRes.json() : [];

      const formatted: AvailableUser[] = [
        ...teachers.map((t: any) => ({
          id: t.userId,
          email: t.user?.email || '',
          name: `${t.firstName} ${t.lastName}`,
          role: 'TEACHER' as const,
        })),
        ...students.map((s: any) => ({
          id: s.userId,
          email: s.user?.email || '',
          name: `${s.firstName} ${s.lastName}`,
          role: 'STUDENT' as const,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          parentEmail: s.parentEmail,
        })),
        ...staff.map((s: any) => ({
          id: s.userId,
          email: s.user?.email || '',
          name: `${s.firstName} ${s.lastName}`,
          role: 'STAFF' as const,
        })),
      ];

      setAvailableUsers(formatted);
      // Conservé séparément : Teacher.id (≠ userId) est requis pour organizerId
      setTeacherOptions(teachers.map((t: any) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` })));
    } catch (err) {
      console.error('Erreur chargement des utilisateurs:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentTeacher();
    fetchMeetings();
    fetchAvailableUsers();
  }, [fetchCurrentTeacher, fetchMeetings, fetchAvailableUsers]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- FILTRAGE & GROUPES ---------------- */

  const filteredMeetings = useMemo(() => {
    let filtered = [...meetings];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.location.toLowerCase().includes(term) ||
          m.organizer.firstName.toLowerCase().includes(term) ||
          m.organizer.lastName.toLowerCase().includes(term)
      );
    }
    if (typeFilter) filtered = filtered.filter((m) => m.type === typeFilter);
    if (periodFilter !== 'ALL') {
      filtered = filtered.filter((m) => {
        const bucket = getBucket(m.date);
        if (periodFilter === 'TODAY') return bucket === 'today';
        if (periodFilter === 'WEEK') return bucket === 'today' || bucket === 'tomorrow' || bucket === 'week';
        if (periodFilter === 'UPCOMING') return bucket !== 'past';
        if (periodFilter === 'PAST') return bucket === 'past';
        return true;
      });
    }
    return filtered;
  }, [meetings, searchTerm, typeFilter, periodFilter]);

  const groupedMeetings = useMemo(() => {
    const groups: Record<Bucket, Meeting[]> = { today: [], tomorrow: [], week: [], later: [], past: [] };
    filteredMeetings.forEach((m) => groups[getBucket(m.date)].push(m));
    (['today', 'tomorrow', 'week', 'later'] as Bucket[]).forEach((b) =>
      groups[b].sort((a, b2) => new Date(a.date).getTime() - new Date(b2.date).getTime())
    );
    groups.past.sort((a, b2) => new Date(b2.date).getTime() - new Date(a.date).getTime());
    return groups;
  }, [filteredMeetings]);

  const stats = useMemo(() => {
    const today = meetings.filter((m) => getBucket(m.date) === 'today').length;
    const week = meetings.filter((m) => ['today', 'tomorrow', 'week'].includes(getBucket(m.date))).length;
    const parentTeacher = meetings.filter(
      (m) => getTypeConfig(m.type).label === TYPE_CONFIG.PARENTS_TEACHERS.label && getBucket(m.date) !== 'past'
    ).length;
    return { total: meetings.length, today, week, parentTeacher };
  }, [meetings]);

  const typeFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    TYPE_SELECT_OPTIONS.forEach((o) => map.set(o.value, o.label));
    meetings.forEach((m) => {
      if (!map.has(m.type)) map.set(m.type, getTypeConfig(m.type).label);
    });
    return Array.from(map.entries());
  }, [meetings]);

  const filteredParticipants = useMemo(() => {
    let list = availableUsers;
    if (participantTab !== 'ALL') list = list.filter((u) => u.role === participantTab);
    if (participantSearch) {
      const term = participantSearch.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    }
    return list;
  }, [availableUsers, participantTab, participantSearch]);

  /* ---------------- CRUD ---------------- */

  const resetForm = () => setForm(EMPTY_FORM(currentTeacherId || ''));

  const closeModal = () => {
    setActiveModal(null);
    setSelectedMeeting(null);
  };

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizerId) {
      notify('Sélectionnez un enseignant organisateur pour créer la réunion.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() };
      const res = await fetch(apiUrl('/meetings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${await res.text()}`);
      closeModal();
      resetForm();
      await fetchMeetings();
      notify('Réunion créée et invitations envoyées.');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la création de la réunion', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date).toISOString(),
        organizerId: form.organizerId || selectedMeeting.organizerId,
      };
      const res = await fetch(apiUrl(`/meetings/${selectedMeeting.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      closeModal();
      resetForm();
      await fetchMeetings();
      notify('Réunion mise à jour.');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeeting = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/meetings/${selectedMeeting.id}`), { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      closeModal();
      await fetchMeetings();
      notify('Réunion supprimée.');
    } catch (err: any) {
      notify(err.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    resetForm();
    setParticipantSearch('');
    setParticipantTab('ALL');
    setActiveModal('create');
  };

  const openDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setActiveModal('details');
  };

  const openDelete = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setActiveModal('delete');
  };

  const openEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setForm({
      title: meeting.title,
      type: meeting.type,
      date: new Date(meeting.date).toISOString().slice(0, 16),
      duration: meeting.duration,
      location: meeting.location,
      agenda: meeting.agenda || '',
      participantUserIds: meeting.participants.map((p) => p.user.id),
      organizerId: meeting.organizerId,
    });
    setParticipantSearch('');
    setParticipantTab('ALL');
    setActiveModal('edit');
  };

  const toggleParticipant = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      participantUserIds: prev.participantUserIds.includes(userId)
        ? prev.participantUserIds.filter((id) => id !== userId)
        : [...prev.participantUserIds, userId],
    }));
  };

  const selectAllVisible = () => {
    setForm((prev) => {
      const ids = new Set(prev.participantUserIds);
      filteredParticipants.forEach((u) => ids.add(u.id));
      return { ...prev, participantUserIds: Array.from(ids) };
    });
  };

  const clearAllVisible = () => {
    setForm((prev) => {
      const visibleIds = new Set(filteredParticipants.map((u) => u.id));
      return { ...prev, participantUserIds: prev.participantUserIds.filter((id) => !visibleIds.has(id)) };
    });
  };

  /* ---------------- UTILS AFFICHAGE ---------------- */

  const getParticipantName = (p: Participant) => {
    if (p.user.studentProfile) return `${p.user.studentProfile.firstName} ${p.user.studentProfile.lastName}`;
    if (p.user.teacherProfile) return `${p.user.teacherProfile.firstName} ${p.user.teacherProfile.lastName}`;
    if (p.user.staffProfile) return `${p.user.staffProfile.firstName} ${p.user.staffProfile.lastName}`;
    return p.user.email;
  };

  const isPastMeeting = (date: string) => new Date(date) < new Date();
  const isParentsMeetingType = (type: string) => getTypeConfig(type).label === TYPE_CONFIG.PARENTS_TEACHERS.label;

  /* ---------------- RENDU ---------------- */

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-2 text-white ${
            toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <Icon icon={toast.kind === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} />
          {toast.message}
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Réunions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Planification des réunions parents-professeurs, conseils de classe et rencontres internes
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={loadingTeacher || (!currentTeacherId && teacherOptions.length === 0)}
          className={`bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md transition flex items-center gap-2 text-sm font-medium shadow-sm ${
            loadingTeacher || (!currentTeacherId && teacherOptions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Icon icon="fa-plus" />
          Programmer une réunion
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-3 text-sm">
          <Icon icon="fa-exclamation-circle" />
          <span>{error}</span>
          <button
            onClick={() => {
              setError(null);
              fetchCurrentTeacher();
              fetchMeetings();
            }}
            className="ml-auto underline text-red-700 hover:text-red-900"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="fa-calendar-days" label="Total planifiées" value={stats.total} accent="text-blue-600" />
        <StatCard icon="fa-sun" label="Aujourd'hui" value={stats.today} accent="text-amber-600" />
        <StatCard icon="fa-calendar-week" label="Cette semaine" value={stats.week} accent="text-emerald-600" />
        <StatCard icon="fa-people-arrows" label="Parents-professeurs à venir" value={stats.parentTeacher} accent="text-purple-600" />
      </div>

      {/* Recherche & filtres */}
      <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Rechercher (titre, lieu, organisateur...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <Icon icon="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-w-[180px]"
          >
            <option value="">Tous les types</option>
            {typeFilterOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {(searchTerm || typeFilter || periodFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setPeriodFilter('ALL');
              }}
              className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition text-sm flex items-center gap-1.5 border border-gray-200 whitespace-nowrap"
            >
              <Icon icon="fa-times" />
              Réinitialiser
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {(
            [
              ['ALL', 'Toutes'],
              ['TODAY', "Aujourd'hui"],
              ['WEEK', 'Cette semaine'],
              ['UPCOMING', 'À venir'],
              ['PAST', 'Passées'],
            ] as [PeriodFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriodFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                periodFilter === value
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-3xl text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">Chargement des réunions...</p>
          </div>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-md border border-gray-100">
          <Icon icon="fa-calendar-days" className="text-5xl text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            {meetings.length === 0 ? 'Aucune réunion planifiée' : 'Aucun résultat'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {meetings.length === 0
              ? 'Programmez votre première réunion parents-professeurs ou interne'
              : 'Ajustez vos filtres pour élargir la recherche'}
          </p>
          {meetings.length === 0 && (currentTeacherId || teacherOptions.length > 0) && (
            <button
              onClick={openCreate}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md text-sm transition inline-flex items-center gap-2"
            >
              <Icon icon="fa-plus" /> Programmer une réunion
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {BUCKET_ORDER.filter((b) => groupedMeetings[b].length > 0).map((bucket) => (
            <section key={bucket}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{BUCKET_LABELS[bucket]}</h2>
                <span className="text-xs text-gray-400">{groupedMeetings[bucket].length}</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="space-y-3">
                {groupedMeetings[bucket].map((meeting) => (
                  <MeetingRow key={meeting.id} meeting={meeting} onDetails={() => openDetails(meeting)} onEdit={() => openEdit(meeting)} onDelete={() => openDelete(meeting)} />
                ))}
              </div>
            </section>
          ))}

          {groupedMeetings.past.length > 0 && (
            <section>
              <button onClick={() => setShowPast((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-3">
                <Icon icon={showPast ? 'fa-chevron-down' : 'fa-chevron-right'} className="text-xs" />
                Réunions passées ({groupedMeetings.past.length})
              </button>
              {showPast && (
                <div className="space-y-3">
                  {groupedMeetings.past.map((meeting) => (
                    <MeetingRow key={meeting.id} meeting={meeting} onDetails={() => openDetails(meeting)} onEdit={() => openEdit(meeting)} onDelete={() => openDelete(meeting)} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <MeetingFormModal
          mode={activeModal}
          form={form}
          setForm={setForm}
          onSubmit={activeModal === 'create' ? createMeeting : updateMeeting}
          onClose={closeModal}
          submitting={submitting}
          teacherOptions={teacherOptions}
          currentTeacherId={currentTeacherId}
          filteredParticipants={filteredParticipants}
          participantSearch={participantSearch}
          setParticipantSearch={setParticipantSearch}
          participantTab={participantTab}
          setParticipantTab={setParticipantTab}
          toggleParticipant={toggleParticipant}
          selectAllVisible={selectAllVisible}
          clearAllVisible={clearAllVisible}
          loadingUsers={loadingUsers}
          availableUsersCount={availableUsers.length}
        />
      )}

      {/* MODAL DÉTAILS */}
      {activeModal === 'details' && selectedMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium mb-2 ${getTypeConfig(selectedMeeting.type).chip}`}>
                  <Icon icon={getTypeConfig(selectedMeeting.type).icon as any} />
                  {getTypeConfig(selectedMeeting.type).label}
                </span>
                <h3 className="text-lg font-semibold text-gray-800">{selectedMeeting.title}</h3>
                <p className="text-sm text-gray-500">{isPastMeeting(selectedMeeting.date) ? 'Réunion passée' : 'Réunion à venir'}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Icon icon="fa-calendar" className="w-4 text-gray-400" />
                <span>{formatFullDate(selectedMeeting.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Icon icon="fa-clock" className="w-4 text-gray-400" />
                <span>{selectedMeeting.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Icon icon="fa-location-dot" className="w-4 text-gray-400" />
                <span>{selectedMeeting.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Icon icon="fa-user" className="w-4 text-gray-400" />
                <span>
                  Organisée par {selectedMeeting.organizer.firstName} {selectedMeeting.organizer.lastName}
                </span>
              </div>
              {selectedMeeting.agenda && (
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ordre du jour</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedMeeting.agenda}</p>
                </div>
              )}
              {isParentsMeetingType(selectedMeeting.type) && (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded flex items-start gap-2 text-purple-700 text-xs">
                  <Icon icon="fa-circle-info" className="mt-0.5" />
                  <span>Les parents des élèves invités sont notifiés via les coordonnées enregistrées dans leur dossier.</span>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Participants ({selectedMeeting.participants.length})</p>
                {selectedMeeting.participants.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun participant</p>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {selectedMeeting.participants.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm border-b border-gray-50 py-1.5">
                        <span className="text-gray-700">{getParticipantName(p)}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{ROLE_LABELS[p.user.role] || p.user.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  closeModal();
                  openEdit(selectedMeeting);
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-md transition flex items-center gap-2"
              >
                <Icon icon="fa-edit" /> Modifier
              </button>
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-md transition">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {activeModal === 'delete' && selectedMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Icon icon="fa-exclamation-triangle" className="text-xl" />
              <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer la réunion <strong>« {selectedMeeting.title} »</strong> ? Cette action est irréversible et annulera l'invitation
              envoyée aux {selectedMeeting.participants.length} participant(s).
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition">
                Annuler
              </button>
              <button
                onClick={deleteMeeting}
                disabled={submitting}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-sm rounded-md transition flex items-center gap-2 disabled:opacity-50"
              >
                <Icon icon={submitting ? 'fa-spinner fa-spin' : 'fa-trash'} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SOUS-COMPOSANTS
============================================================ */

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: number; accent: string }) {
  return (
    <div className="bg-white rounded-md border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center ${accent}`}>
        <Icon icon={icon as any} />
      </div>
      <div>
        <p className="text-xl font-semibold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function MeetingRow({ meeting, onDetails, onEdit, onDelete }: { meeting: Meeting; onDetails: () => void; onEdit: () => void; onDelete: () => void }) {
  const cfg = getTypeConfig(meeting.type);
  const { day, month } = formatDayLabel(meeting.date);
  const past = new Date(meeting.date) < new Date();

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 hover:shadow-md transition flex overflow-hidden">
      <div className={`w-20 flex flex-col items-center justify-center py-3 border-r border-gray-100 ${past ? 'bg-gray-50' : 'bg-blue-50/50'}`}>
        <span className={`text-xl font-semibold ${past ? 'text-gray-400' : 'text-blue-700'}`}>{day}</span>
        <span className={`text-xs uppercase ${past ? 'text-gray-400' : 'text-blue-500'}`}>{month}</span>
      </div>
      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.chip}`}>
              <Icon icon={cfg.icon as any} />
              {cfg.label}
            </span>
            {past && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Passée</span>}
          </div>
          <h3 className="font-semibold text-gray-800 mt-1.5 truncate">{meeting.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Icon icon="fa-clock" className="text-gray-400" />
              {formatTime(meeting.date)} · {meeting.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="fa-location-dot" className="text-gray-400" />
              {meeting.location}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="fa-user" className="text-gray-400" />
              {meeting.organizer.firstName} {meeting.organizer.lastName}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="fa-users" className="text-gray-400" />
              {meeting.participants.length} participant{meeting.participants.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onDetails} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium transition flex items-center gap-1.5">
            <Icon icon="fa-eye" /> Détails
          </button>
          <button onClick={onEdit} className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded text-xs font-medium transition" title="Modifier">
            <Icon icon="fa-edit" />
          </button>
          <button onClick={onDelete} className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded text-xs font-medium transition" title="Supprimer">
            <Icon icon="fa-trash" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingFormModal({
  mode,
  form,
  setForm,
  onSubmit,
  onClose,
  submitting,
  teacherOptions,
  currentTeacherId,
  filteredParticipants,
  participantSearch,
  setParticipantSearch,
  participantTab,
  setParticipantTab,
  toggleParticipant,
  selectAllVisible,
  clearAllVisible,
  loadingUsers,
  availableUsersCount,
}: {
  mode: 'create' | 'edit';
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
  teacherOptions: TeacherOption[];
  currentTeacherId: string | null;
  filteredParticipants: AvailableUser[];
  participantSearch: string;
  setParticipantSearch: (v: string) => void;
  participantTab: ParticipantRoleTab;
  setParticipantTab: (v: ParticipantRoleTab) => void;
  toggleParticipant: (id: string) => void;
  selectAllVisible: () => void;
  clearAllVisible: () => void;
  loadingUsers: boolean;
  availableUsersCount: number;
}) {
  const isParentsMeeting = form.type === 'PARENTS_TEACHERS';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Icon icon={mode === 'create' ? 'fa-calendar-plus' : 'fa-edit'} className="text-blue-600" />
            {mode === 'create' ? 'Programmer une réunion' : 'Modifier la réunion'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon icon="fa-times" className="text-xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              required
              placeholder="Ex : Réunion parents-professeurs - Trimestre 1"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de réunion *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPE_SELECT_OPTIONS.map((opt) => {
                const cfg = getTypeConfig(opt.value);
                const active = form.type === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setForm({ ...form, type: opt.value })}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-xs font-medium transition text-left ${
                      active ? `${cfg.chip} ring-1 ring-inset ring-current` : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon icon={cfg.icon as any} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(teacherOptions.length > 1 || !currentTeacherId) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisateur (enseignant) *</label>
              <select
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.organizerId}
                onChange={(e) => setForm({ ...form, organizerId: e.target.value })}
              >
                {!form.organizerId && <option value="">Sélectionner un enseignant</option>}
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.id === currentTeacherId ? '(vous)' : ''}
                  </option>
                ))}
              </select>
              {!currentTeacherId && teacherOptions.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Aucun enseignant disponible. Créez d'abord un enseignant pour pouvoir l'assigner comme organisateur.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
              <input
                type="datetime-local"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée *</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  required
                  min="5"
                  step="5"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">min</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                {DURATION_PRESETS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setForm({ ...form, duration: d })}
                    className={`px-2 py-0.5 rounded text-xs border transition ${
                      form.duration === d ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu *</label>
            <input
              type="text"
              required
              placeholder="Ex : Salle des professeurs, Salle 12, Visioconférence..."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordre du jour</label>
            <textarea
              rows={3}
              placeholder="Points à aborder pendant la réunion..."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Participants</label>
              <span className="text-xs text-gray-400">{form.participantUserIds.length} sélectionné(s)</span>
            </div>

            {isParentsMeeting && (
              <div className="mb-2 p-2.5 bg-purple-50 border border-purple-100 rounded flex items-start gap-2 text-purple-700 text-xs">
                <Icon icon="fa-circle-info" className="mt-0.5" />
                <span>Sélectionnez les élèves concernés : leurs parents seront invités via les coordonnées enregistrées dans le dossier de l'élève.</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-2">
              {(
                [
                  ['ALL', 'Tous'],
                  ['TEACHER', 'Enseignants'],
                  ['STUDENT', 'Élèves'],
                  ['STAFF', 'Personnel'],
                ] as [ParticipantRoleTab, string][]
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setParticipantTab(value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    participantTab === value ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Rechercher un participant..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <Icon icon="fa-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            </div>

            {loadingUsers ? (
              <p className="text-xs text-gray-400 py-3">Chargement des utilisateurs...</p>
            ) : availableUsersCount === 0 ? (
              <p className="text-xs text-gray-400 py-3">Aucun utilisateur disponible</p>
            ) : (
              <>
                <div className="border border-gray-200 rounded-md p-1.5 max-h-48 overflow-y-auto">
                  {filteredParticipants.length === 0 ? (
                    <p className="text-xs text-gray-400 p-2">Aucun résultat</p>
                  ) : (
                    filteredParticipants.map((user) => (
                      <label key={user.id} className="flex items-start gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={form.participantUserIds.includes(user.id)}
                          onChange={() => toggleParticipant(user.id)}
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate">{user.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{ROLE_LABELS[user.role]}</span>
                          </span>
                          <span className="block text-xs text-gray-400 truncate">{user.email}</span>
                          {user.role === 'STUDENT' && (user.parentName || user.parentPhone) && (
                            <span className="block text-xs text-purple-600 truncate">
                              Parent : {user.parentName || '—'} {user.parentPhone ? `· ${user.parentPhone}` : ''}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-between mt-1.5">
                  <button type="button" onClick={selectAllVisible} className="text-xs text-blue-600 hover:underline">
                    Tout sélectionner
                  </button>
                  <button type="button" onClick={clearAllVisible} className="text-xs text-gray-400 hover:underline">
                    Tout désélectionner
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition">
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Icon icon={submitting ? 'fa-spinner fa-spin' : 'fa-save'} />
              {mode === 'create' ? 'Créer et inviter' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}