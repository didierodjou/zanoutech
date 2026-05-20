// app/admin/meetings/page.tsx
'use client';
import { useState, useEffect } from 'react';

interface Meeting {
  id: string;
  title: string;
  type: string;
  date: string;
  duration: number;
  location: string;
  agenda: string | null;
  organizer: { firstName: string; lastName: string };
  participants: Array<{ user: { email: string; role: string } }>;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'STAFF', date: '', duration: 60, location: '', agenda: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getToken = () => localStorage.getItem('token');

  const fetchMeetings = async () => {
    const token = getToken();
    if (!token) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMeetings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur chargement réunions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError('Non authentifié');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, date: new Date(form.date) }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setShowForm(false);
      setForm({ title: '', type: 'STAFF', date: '', duration: 60, location: '', agenda: '' });
      fetchMeetings();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Réunions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Nouvelle réunion
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-8">
            Aucune réunion planifiée
          </div>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow p-5 border border-slate-100">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{m.title}</h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded">{m.type}</span>
              </div>
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                <i className="fas fa-calendar"></i> {new Date(m.date).toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <i className="fas fa-location-dot"></i> {m.location}
              </p>
              <p className="text-sm mt-2">{m.agenda || 'Pas d’ordre du jour'}</p>
              <div className="mt-3 text-xs text-slate-400">
                Organisée par {m.organizer.firstName} {m.organizer.lastName}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Créer une réunion</h2>
            <form onSubmit={createMeeting} className="space-y-3">
              <input
                type="text"
                placeholder="Titre"
                className="w-full border rounded p-2"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                type="datetime-local"
                className="w-full border rounded p-2"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Lieu"
                className="w-full border rounded p-2"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
              <textarea
                placeholder="Ordre du jour"
                className="w-full border rounded p-2"
                rows={2}
                value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}