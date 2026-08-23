'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudent } from '@/context/StudentContext';
import { LoadingSpinner, ErrorState } from '@/components/student';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Meeting {
  id: string;
  title: string;
  type: string;
  date: string;
  duration: number;
  location: string;
  agenda?: string;
  organizer: { firstName: string; lastName: string };
}

export default function MeetingsPage() {
  const { student, loading: studentLoading } = useStudent();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student?.id) return;

    const fetchMeetings = async () => {
      //const token = localStorage.getItem('token');
      try {
        // Utiliser l'endpoint que nous venons de créer
        const res = await fetch(`${API_BASE}/meetings/student/${student.id}`, {
          credentials: 'include',
          //headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erreur ${res.status}: ${errorText || 'Impossible de charger les réunions'}`);
        }

        const data = await res.json();
        setMeetings(data);
      } catch (err: any) {
        console.error('Erreur réunions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [student]);

  if (studentLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  const now = new Date();
  const upcoming = meetings
    .filter(m => new Date(m.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = meetings
    .filter(m => new Date(m.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Réunions</h1>
        <p className="text-slate-500 text-sm">Suivez vos rendez-vous et réunions programmées</p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Icon icon="fa-calendar-alt" className="text-indigo-500" /> À venir
          </h2>
          <div className="space-y-3">
            {upcoming.map(meeting => <MeetingCard key={meeting.id} meeting={meeting} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <Icon icon="fa-history" className="text-slate-400" /> Passées
          </h2>
          <div className="space-y-3">
            {past.map(meeting => <MeetingCard key={meeting.id} meeting={meeting} />)}
          </div>
        </div>
      )}

      {meetings.length === 0 && !error && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <Icon icon="fa-users" className="text-4xl text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Aucune réunion pour le moment</p>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const date = new Date(meeting.date);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{meeting.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Organisé par {meeting.organizer.firstName} {meeting.organizer.lastName}
          </p>
        </div>
        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
          {meeting.type}
        </span>
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <Icon icon="fa-calendar-day" className="text-indigo-400" /> {formattedDate}
        </div>
        <div className="flex items-center gap-1">
          <Icon icon="fa-clock" className="text-indigo-400" /> {formattedTime} ({meeting.duration} min)
        </div>
        <div className="flex items-center gap-1">
          <Icon icon="fa-location-dot" className="text-indigo-400" /> {meeting.location}
        </div>
      </div>
      {meeting.agenda && (
        <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
          {meeting.agenda}
        </p>
      )}
    </motion.div>
  );
}