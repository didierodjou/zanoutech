'use client';

import { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/Icon';

type Participant = {
  user: {
    id: string;
    email: string;
    role: string;
    studentProfile?: { firstName: string; lastName: string } | null;
    teacherProfile?: { firstName: string; lastName: string } | null;
    staffProfile?: { firstName: string; lastName: string } | null;
  };
};

type Meeting = {
  id: string;
  title: string;
  type: string;
  date: string;
  duration: number;
  location: string;
  agenda: string | null;
  isOrganizer: boolean;
  organizer: { firstName: string; lastName: string };
  participants: Participant[];
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function participantName(p: Participant) {
  const u = p.user;
  const profile = u.teacherProfile || u.staffProfile || u.studentProfile;
  return profile ? `${profile.firstName} ${profile.lastName}` : u.email;
}

export default function TeacherMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selected, setSelected] = useState<Meeting | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Récupère l'utilisateur + son profil enseignant (id Teacher != id User)
        const meRes = await fetch(`${baseUrl}/auth/me`, { method: 'POST', credentials: 'include' });
        if (!meRes.ok) return;
        const me = await meRes.json();

        const teacherRes = await fetch(
          `${baseUrl}/teachers/profile-by-email?email=${encodeURIComponent(me.user.email)}`,
          { credentials: 'include' },
        );
        if (!teacherRes.ok) return;
        const teacher = await teacherRes.json();

        const meetingsRes = await fetch(`${baseUrl}/meetings/teacher/${teacher.id}`, {
          credentials: 'include',
        });
        if (meetingsRes.ok) setMeetings(await meetingsRes.json());
      } catch (e) {
        console.error('Erreur chargement réunions', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return meetings
      .filter((m) => (filter === 'upcoming' ? new Date(m.date).getTime() >= now : new Date(m.date).getTime() < now))
      .sort((a, b) =>
        filter === 'upcoming'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
  }, [meetings, filter]);

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Réunions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vos réunions organisées ou auxquelles vous êtes convié(e).</p>
      </div>

      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            filter === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          À venir
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            filter === 'past' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Passées
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <Icon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
          <p className="text-sm">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Icon icon="fa-users" className="text-3xl text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">
            {filter === 'upcoming' ? 'Aucune réunion à venir' : 'Aucune réunion passée'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="text-left bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                {m.isOrganizer && (
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    Organisateur
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <Icon icon="fa-tag" className="text-slate-400 w-3.5" />
                  {m.type}
                </p>
                <p className="flex items-center gap-2">
                  <Icon icon="fa-clock" className="text-slate-400 w-3.5" />
                  {new Date(m.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                  {m.duration} min
                </p>
                <p className="flex items-center gap-2">
                  <Icon icon="fa-map-marker-alt" className="text-slate-400 w-3.5" />
                  {m.location}
                </p>
                <p className="flex items-center gap-2">
                  <Icon icon="fa-user-tie" className="text-slate-400 w-3.5" />
                  {m.organizer.firstName} {m.organizer.lastName}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {m.participants.length} participant{m.participants.length > 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selected.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{selected.type}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <Icon icon="fa-times" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-700 mb-4">
              <p className="flex items-center gap-2">
                <Icon icon="fa-clock" className="text-slate-400 w-4" />
                {new Date(selected.date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })} ·{' '}
                {selected.duration} min
              </p>
              <p className="flex items-center gap-2">
                <Icon icon="fa-map-marker-alt" className="text-slate-400 w-4" />
                {selected.location}
              </p>
              <p className="flex items-center gap-2">
                <Icon icon="fa-user-tie" className="text-slate-400 w-4" />
                Organisé par {selected.organizer.firstName} {selected.organizer.lastName}
              </p>
            </div>

            {selected.agenda && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-600 mb-1">Ordre du jour</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {selected.agenda}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Participants ({selected.participants.length})
              </p>
              <div className="space-y-1.5">
                {selected.participants.map((p) => (
                  <div
                    key={p.user.id}
                    className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
                  >
                    <Icon icon="fa-user" className="text-slate-400" />
                    {participantName(p)}
                    <span className="ml-auto text-[10px] text-slate-400">{p.user.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}